import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { exportUserTopicCards, importUserTopicCards } from '../flashcardsApi'
import { getPresignedUrl } from '../../../utils/s3Upload'
import './ImportExportModal.css'

function ImportExportModal({ deckId, topic, onClose, onImportSuccess }) {
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
        setErrorMsg(t('userDeckDetail.errorImportFailed'))
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
      const blob = await exportUserTopicCards(deckId, topic._id)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `vocab_${topic.name.replace(/\s+/g, '_')}_export.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setSuccessMsg(t('api.success.CARD_EXPORT_SUCCESS'))
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || t('userDeckDetail.errorExportFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // Thực thi Nhập file Excel
  const handleImportSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      setErrorMsg(t('userDeckDetail.errorNoFileSelected'))
      return
    }

    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    setImportResult(null)

    try {
      // 1. Gọi API lấy presigned URL từ backend
      const presignedRes = await getPresignedUrl({
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        purpose: 'deck-import',
        fileSize: selectedFile.size
      })

      if (!presignedRes.success || !presignedRes.data?.uploadUrl) {
        throw new Error(presignedRes.message || t('userDeckDetail.errorUploadFailed'))
      }

      const { uploadUrl, url } = presignedRes.data

      // 2. Upload file nhị phân trực tiếp lên S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })

      if (!uploadResponse.ok) {
        throw new Error(t('userDeckDetail.errorUploadFailed'))
      }

      // 3. Gọi API import từ vựng với S3 URL nhận được
      const importRes = await importUserTopicCards(deckId, topic._id, {
        fileUrl: url,
        mode: importMode
      })

      if (importRes.success) {
        const summary = importRes.data?.summary
        setImportResult(summary)
        
        if (summary && summary.failed > 0) {
          setErrorMsg(t('userDeckDetail.importFailureMsg'))
        } else {
          setSuccessMsg(t('userDeckDetail.importSuccessMsg'))
          // Gọi callback báo cho màn hình cha tải lại danh sách thẻ từ
          if (onImportSuccess) {
            onImportSuccess()
          }
        }
      } else {
        setErrorMsg(importRes.message || t('userDeckDetail.errorImportFailed'))
      }
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || err.message || t('userDeckDetail.errorImportFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="import-export-modal-overlay" onClick={onClose}>
      <div className="import-export-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="import-export-modal-header">
          <h3 className="import-export-modal-title">{t('userDeckDetail.importExportModalTitle')}</h3>
          <button className="import-export-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="import-export-modal-tabs">
          <button 
            type="button" 
            className={`import-export-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => handleTabChange('export')}
          >
            {t('userDeckDetail.exportTab')}
          </button>
          <button 
            type="button" 
            className={`import-export-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => handleTabChange('import')}
          >
            {t('userDeckDetail.importTab')}
          </button>
        </div>

        {/* Modal Body */}
        <div className="import-export-modal-body">
          {errorMsg && <div className="import-export-error-box">{errorMsg}</div>}
          {successMsg && <div className="import-export-success-box">{successMsg}</div>}

          {activeTab === 'export' ? (
            // Nội dung Tab EXPORT
            <div className="export-tab-content">
              <p className="import-export-description">
                {t('userDeckDetail.cardsInTopic', { topicName: topic.name })}. 
                Xuất tất cả thẻ từ vựng trong chủ đề này ra file Excel (.xlsx) để sao lưu hoặc chỉnh sửa.
              </p>
            </div>
          ) : (
            // Nội dung Tab IMPORT
            <div className="import-tab-content">
              
              {/* Nút tải file mẫu */}
              <div className="template-download-container">
                <a 
                  href="/templates/vocab_import_template.xlsx" 
                  className="template-download-link" 
                  download="vocab_import_template.xlsx"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {t('userDeckDetail.downloadTemplateBtn')}
                </a>
              </div>

              {/* Form chọn file và tải lên */}
              <form onSubmit={handleImportSubmit}>
                
                {/* Drag and Drop Zone */}
                {!selectedFile ? (
                  <div 
                    className={`file-upload-zone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleSelectFileClick}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden-file-input"
                      style={{ display: 'none' }}
                      accept=".xlsx"
                      onChange={handleFileChange}
                    />
                    <div className="file-upload-icon">
                      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div className="file-upload-text">{t('userDeckDetail.selectFileBtn')}</div>
                    <div className="file-upload-subtext">Kéo thả file .xlsx vào đây hoặc click để chọn</div>
                  </div>
                ) : (
                  // Hiển thị file đã chọn
                  <div className="selected-file-display">
                    <div className="selected-file-info">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-secondary)' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <div>
                        <div className="selected-file-name">{selectedFile.name}</div>
                        <div className="selected-file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="remove-file-btn" 
                      onClick={handleRemoveFile}
                      disabled={isLoading}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Chọn chế độ Import */}
                <div className="import-form-group">
                  <label className="import-form-label">{t('userDeckDetail.importModeLabel')}</label>
                  <select 
                    className="form-select" 
                    value={importMode} 
                    onChange={(e) => setImportMode(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="append">{t('userDeckDetail.importModeAppend')}</option>
                    <option value="replace">{t('userDeckDetail.importModeReplace')}</option>
                    <option value="upsert">{t('userDeckDetail.importModeUpsert')}</option>
                  </select>
                </div>
              </form>

              {/* Báo cáo kết quả sau khi Import */}
              {importResult && (
                <div className="import-summary-container">
                  <h4 className="import-summary-title">{t('userDeckDetail.importResultsSummary')}</h4>
                  <div className="import-summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">{t('userDeckDetail.importResultTotal', { total: '' }).replace(':', '')}</span>
                      <span className="summary-value">{importResult.totalRows}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">{t('userDeckDetail.importResultInserted', { inserted: '' }).replace(':', '')}</span>
                      <span className="summary-value success">{importResult.inserted}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">{t('userDeckDetail.importResultUpdated', { updated: '' }).replace(':', '')}</span>
                      <span className="summary-value">{importResult.updated}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">{t('userDeckDetail.importResultSkipped', { skipped: '' }).replace(':', '')}</span>
                      <span className="summary-value">{importResult.skipped}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">{t('userDeckDetail.importResultFailed', { failed: '' }).replace(':', '')}</span>
                      <span className="summary-value error">{importResult.failed}</span>
                    </div>
                  </div>

                  {/* Chi tiết danh sách dòng bị lỗi */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="import-errors-container">
                      <h5 className="import-errors-title">{t('userDeckDetail.importResultErrors')}</h5>
                      <ul className="import-errors-list">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx} className="import-error-item">
                            <span className="import-error-row-num">Dòng {err.row}:</span>
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

        {/* Modal Actions Footer */}
        <div className="import-export-modal-footer">
          <button 
            type="button" 
            className="footer-btn-cancel" 
            onClick={onClose}
            disabled={isLoading}
          >
            {t('decks.cancelBtn')}
          </button>
          {activeTab === 'export' ? (
            <button 
              type="button" 
              className="footer-btn-submit"
              onClick={handleExport}
              disabled={isLoading}
            >
              {isLoading ? t('decks.processing') : t('userDeckDetail.exportBtn')}
            </button>
          ) : (
            <button 
              type="button" 
              className="footer-btn-submit"
              onClick={handleImportSubmit}
              disabled={isLoading || !selectedFile}
            >
              {isLoading ? t('decks.processing') : t('userDeckDetail.importBtn')}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default ImportExportModal
