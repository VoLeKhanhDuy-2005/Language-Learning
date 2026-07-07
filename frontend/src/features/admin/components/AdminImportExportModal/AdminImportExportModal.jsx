import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { exportAdminTopicCardsApi, importAdminTopicCardsApi } from '../../adminApi'
import { getPresignedUrl } from '../../../../utils/s3Upload'
import './AdminImportExportModal.css'

// ---------------------------------------------------------------------------
// Tạo file .xlsx mẫu ngay trên client (không cần thư viện)
// Định dạng: OOXML tối giản, 1 sheet, header + 2 dòng mẫu
// ---------------------------------------------------------------------------
const ADMIN_TEMPLATE_COLUMNS = [
  'term', 'translation', 'pos', 'phonetics',
  'explanation_vi', 'explanation_en',
  'examples_vi', 'examples_en', 'imageUrl',
]

const ADMIN_SAMPLE_ROWS = [
  [
    'example',
    'ví dụ',
    'noun',
    '[{"text":"/ɪɡˈzɑːmpl/","audio":""}]',
    'Một trường hợp điển hình minh hoạ cho điều gì đó',
    'A typical instance serving as a model or illustration',
    'Đây là một ví dụ điển hình.',
    'This is a typical example.',
    '',
  ],
  [
    'vocabulary',
    'từ vựng',
    'noun',
    '[{"text":"/vəˈkæbjʊləri/","audio":""}]',
    'Tập hợp các từ được sử dụng trong một ngôn ngữ',
    'The body of words used in a particular language or field',
    'Từ vựng phong phú giúp giao tiếp hiệu quả hơn.',
    'A rich vocabulary helps you communicate more effectively.',
    '',
  ],
]

/**
 * Escape ký tự đặc biệt XML
 */
const escXml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/**
 * Chuyển số cột (0-indexed) thành ký hiệu cột Excel (A, B, ..., Z, AA, ...)
 */
const colLetter = (idx) => {
  let letter = ''
  let n = idx
  while (n >= 0) {
    letter = String.fromCharCode(65 + (n % 26)) + letter
    n = Math.floor(n / 26) - 1
  }
  return letter
}

/**
 * Build nội dung sheet XML từ mảng rows (mỗi row là mảng string)
 */
const buildSheetXml = (rows) => {
  const rowsXml = rows
    .map((row, rIdx) => {
      const cells = row
        .map((val, cIdx) => {
          const ref = `${colLetter(cIdx)}${rIdx + 1}`
          return `<c r="${ref}" t="inlineStr"><is><t>${escXml(val)}</t></is></c>`
        })
        .join('')
      return `<row r="${rIdx + 1}">${cells}</row>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowsXml}</sheetData>
</worksheet>`
}

/**
 * Tạo file .xlsx (ZIP OOXML) dưới dạng Uint8Array tối giản
 * Dùng thuần JS - không cần thư viện ngoài
 */
const buildXlsxBlob = (rows) => {
  const sheetXml = buildSheetXml(rows)

  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Cards" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    'xl/worksheets/sheet1.xml': sheetXml,
  }

  // Build ZIP manually (STORED, no compression)
  const enc = new TextEncoder()
  const parts = []
  const centralDir = []
  let offset = 0

  const u32 = (n) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b }
  const u16 = (n) => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b }

  const crc32 = (buf) => {
    let crc = 0xFFFFFFFF
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i]
      for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  const concat = (...arrays) => {
    const total = arrays.reduce((s, a) => s + a.length, 0)
    const out = new Uint8Array(total)
    let pos = 0
    for (const a of arrays) { out.set(a, pos); pos += a.length }
    return out
  }

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = enc.encode(name)
    const dataBytes = enc.encode(content)
    const crc = crc32(dataBytes)
    const size = dataBytes.length

    // Local file header
    const localHeader = concat(
      new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // signature
      u16(20),         // version needed
      u16(0),          // flags
      u16(0),          // compression: STORED
      u16(0), u16(0),  // mod time/date
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),          // extra length
      nameBytes,
    )

    parts.push(localHeader, dataBytes)

    // Central directory entry
    centralDir.push(concat(
      new Uint8Array([0x50, 0x4B, 0x01, 0x02]), // signature
      u16(20), u16(20), u16(0), u16(0),
      u16(0), u16(0),
      u32(crc), u32(size), u32(size),
      u16(nameBytes.length), u16(0), u16(0),
      u16(0), u16(0),
      u32(0),          // external attrs
      u32(offset),
      nameBytes,
    ))

    offset += localHeader.length + size
  }

  const cdBytes = concat(...centralDir)
  const eocd = concat(
    new Uint8Array([0x50, 0x4B, 0x05, 0x06]),
    u16(0), u16(0),
    u16(centralDir.length), u16(centralDir.length),
    u32(cdBytes.length),
    u32(offset),
    u16(0),
  )

  return new Blob([concat(...parts, cdBytes, eocd)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

const handleDownloadAdminTemplate = () => {
  const rows = [ADMIN_TEMPLATE_COLUMNS, ...ADMIN_SAMPLE_ROWS]
  const blob = buildXlsxBlob(rows)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'admin_vocab_import_template.xlsx'
  document.body.appendChild(a)
  a.click()
  a.parentNode.removeChild(a)
  URL.revokeObjectURL(url)
}

function AdminImportExportModal({ deckId, topic, onClose, onImportSuccess }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('export') // 'export' | 'import'
  const [importMode, setImportMode] = useState('append') // 'append' | 'replace' | 'upsert'
  const [selectedFile, setSelectedFile] = useState(null)

  // States cho xử lý hành động
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // State lưu kết quả import trả về từ server
  const [importResult, setImportResult] = useState(null)

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef(null)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setErrorMsg('')
    setSuccessMsg('')
    setImportResult(null)
  }

  // Xử lý kéo thả file
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.xlsx')) {
        setSelectedFile(file)
        setErrorMsg('')
        setImportResult(null)
      } else {
        setErrorMsg('Chỉ hỗ trợ file .xlsx')
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setErrorMsg('')
      setImportResult(null)
    }
  }

  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setImportResult(null)
    setErrorMsg('')
  }

  // Thực thi Xuất file Excel
  const handleExport = async () => {
    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const blob = await exportAdminTopicCardsApi(deckId, topic._id)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `vocab_${(topic.name || 'topic').replace(/\s+/g, '_')}_export.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccessMsg(t('admin.exportSuccess'))
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || t('admin.exportFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // Thực thi Nhập file Excel
  const handleImportSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!selectedFile) {
      setErrorMsg(t('admin.importNoFile'))
      return
    }

    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    setImportResult(null)

    try {
      // 1. Lấy presigned URL từ backend
      const presignedRes = await getPresignedUrl({
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        purpose: 'deck-import',
        fileSize: selectedFile.size,
      })

      if (!presignedRes.success || !presignedRes.data?.uploadUrl) {
        throw new Error(presignedRes.message || t('admin.uploadFailed'))
      }

      const { uploadUrl, url } = presignedRes.data

      // 2. Upload file lên S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(t('admin.uploadFailed'))
      }

      // 3. Gọi API import
      const importRes = await importAdminTopicCardsApi(deckId, topic._id, {
        fileUrl: url,
        mode: importMode,
      })

      if (importRes.success) {
        const summary = importRes.data?.summary
        setImportResult(summary)

        if (summary && summary.failed > 0) {
          setErrorMsg(t('admin.importPartialError'))
        } else {
          setSuccessMsg(t('admin.importSuccess'))
          if (onImportSuccess) {
            onImportSuccess()
          }
        }
      } else {
        setErrorMsg(importRes.message || t('admin.importFailed'))
      }
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || err.message || t('admin.importFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const importModeDescriptions = {
    append: t('admin.importModeAppendDesc'),
    replace: t('admin.importModeReplaceDesc'),
    upsert: t('admin.importModeUpsertDesc'),
  }

  const importModeNames = {
    append: t('admin.importModeAppendName'),
    replace: t('admin.importModeReplaceName'),
    upsert: t('admin.importModeUpsertName'),
  }

  return (
    <div className="admin-ie-overlay" onClick={onClose}>
      <div className="admin-ie-container" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="admin-ie-header">
          <div className="admin-ie-header-left">
            <div className="admin-ie-header-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div>
              <h3 className="admin-ie-title">{t('admin.importExportModalTitle')}</h3>
              <p className="admin-ie-subtitle">{t('admin.importExportSubtitle')} <strong>{topic?.name}</strong></p>
            </div>
          </div>
          <button className="admin-ie-close-btn" onClick={onClose} aria-label={t('admin.cancelBtn2')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="admin-ie-tabs">
          <button
            type="button"
            className={`admin-ie-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => handleTabChange('export')}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('admin.exportTabBtn')}
          </button>
          <button
            type="button"
            className={`admin-ie-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => handleTabChange('import')}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {t('admin.importTabBtn')}
          </button>
        </div>

        {/* Modal Body */}
        <div className="admin-ie-body">
          {errorMsg && (
            <div className="admin-ie-alert admin-ie-alert-error">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="admin-ie-alert admin-ie-alert-success">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {successMsg}
            </div>
          )}

          {activeTab === 'export' ? (
            // === TAB XUẤT ===
            <div className="admin-ie-export-content">
              <div className="admin-ie-info-card">
                <div className="admin-ie-info-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <h4 className="admin-ie-info-title">{t('admin.exportInfoTitle')}</h4>
                  <p className="admin-ie-info-desc">
                    {t('admin.exportInfoDesc').replace('{{topic}}', topic?.name || '')}
                    <code>term</code>, <code>translation</code>, <code>pos</code>, <code>phonetics</code>, <code>explanation_vi</code>, <code>explanation_en</code>, <code>examples_vi</code>, <code>examples_en</code>, <code>imageUrl</code>.
                  </p>
                </div>
              </div>

              <div className="admin-ie-columns-preview">
                <p className="admin-ie-columns-label">{t('admin.exportColumnsLabel')}</p>
                <div className="admin-ie-columns-list">
                  {['term*', 'translation*', 'pos', 'phonetics', 'explanation_vi', 'explanation_en', 'examples_vi', 'examples_en', 'imageUrl'].map((col) => (
                    <span key={col} className={`admin-ie-col-tag ${col.endsWith('*') ? 'required' : ''}`}>
                      {col.replace('*', '')}
                      {col.endsWith('*') && <span className="admin-ie-col-required">*</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // === TAB NHẬP ===
            <div className="admin-ie-import-content">

              {/* Template download */}
              <div className="admin-ie-template-bar">
                <span className="admin-ie-template-hint">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {t('admin.templateHint')}
                </span>
                <button
                  type="button"
                  className="admin-ie-template-link"
                  onClick={handleDownloadAdminTemplate}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {t('admin.downloadTemplateBtn')}
                </button>
              </div>

              {/* File upload zone */}
              {!selectedFile ? (
                <div
                  className={`admin-ie-dropzone ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleSelectFileClick}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".xlsx"
                    onChange={handleFileChange}
                  />
                  <div className="admin-ie-dropzone-icon">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="admin-ie-dropzone-text">{t('admin.dropzoneText')}</p>
                  <p className="admin-ie-dropzone-subtext">{t('admin.dropzoneSubtext')} <span className="admin-ie-dropzone-highlight">{t('admin.dropzoneHighlight')}</span></p>
                </div>
              ) : (
                <div className="admin-ie-file-selected">
                  <div className="admin-ie-file-info">
                    <div className="admin-ie-file-icon">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <div>
                      <div className="admin-ie-file-name">{selectedFile.name}</div>
                      <div className="admin-ie-file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="admin-ie-file-remove"
                    onClick={handleRemoveFile}
                    disabled={isLoading}
                    title={t('admin.cancelBtn2')}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Import mode selector */}
              <div className="admin-ie-mode-group">
                <label className="admin-ie-mode-label">{t('admin.importModeLabel')}</label>
                <div className="admin-ie-mode-options">
                  {['append', 'replace', 'upsert'].map((mode) => (
                    <label
                      key={mode}
                      className={`admin-ie-mode-option ${importMode === mode ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        value={mode}
                        checked={importMode === mode}
                        onChange={() => setImportMode(mode)}
                        disabled={isLoading}
                        style={{ display: 'none' }}
                      />
                      <div className="admin-ie-mode-radio">
                        {importMode === mode && (
                          <div className="admin-ie-mode-radio-dot" />
                        )}
                      </div>
                      <div>
                        <div className="admin-ie-mode-name">
                          {importModeNames[mode]}
                        </div>
                        <div className="admin-ie-mode-desc">{importModeDescriptions[mode]}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Import result summary */}
              {importResult && (
                <div className="admin-ie-result">
                  <h4 className="admin-ie-result-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    {t('admin.importResultTitle')}
                  </h4>
                  <div className="admin-ie-result-grid">
                    <div className="admin-ie-result-item">
                      <span className="admin-ie-result-label">{t('admin.importResultTotalRows')}</span>
                      <span className="admin-ie-result-val">{importResult.totalRows}</span>
                    </div>
                    <div className="admin-ie-result-item">
                      <span className="admin-ie-result-label">{t('admin.importResultInserted')}</span>
                      <span className="admin-ie-result-val success">{importResult.inserted}</span>
                    </div>
                    <div className="admin-ie-result-item">
                      <span className="admin-ie-result-label">{t('admin.importResultUpdated')}</span>
                      <span className="admin-ie-result-val">{importResult.updated}</span>
                    </div>
                    <div className="admin-ie-result-item">
                      <span className="admin-ie-result-label">{t('admin.importResultSkipped')}</span>
                      <span className="admin-ie-result-val">{importResult.skipped}</span>
                    </div>
                    <div className="admin-ie-result-item">
                      <span className="admin-ie-result-label">{t('admin.importResultFailed')}</span>
                      <span className="admin-ie-result-val error">{importResult.failed}</span>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="admin-ie-errors">
                      <p className="admin-ie-errors-title">{t('admin.importResultErrorsTitle')}</p>
                      <ul className="admin-ie-errors-list">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx} className="admin-ie-error-item">
                            <span className="admin-ie-error-row">{t('admin.importResultErrorRow')} {err.row}:</span>
                            {err.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="admin-ie-footer">
          <button
            type="button"
            className="admin-ie-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('admin.cancelBtn2')}
          </button>
          {activeTab === 'export' ? (
            <button
              type="button"
              className="admin-ie-btn-submit"
              onClick={handleExport}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="admin-ie-spinner" />
                  {t('admin.exportLoading')}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {t('admin.exportBtn')}
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="admin-ie-btn-submit"
              onClick={handleImportSubmit}
              disabled={isLoading || !selectedFile}
            >
              {isLoading ? (
                <>
                  <span className="admin-ie-spinner" />
                  {t('admin.importLoading')}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {t('admin.importBtn')}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default AdminImportExportModal
