import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '../../../../components/Input/Input'
import TagPickerModal from '../../components/TagPickerModal/TagPickerModal'
import { createAdminDeckApi, listCefrLevelsApi, listTagsApi } from '../../adminApi'
import { getPresignedUrl, uploadAudioToS3 } from '../../../../utils/s3Upload'
import { validateImageMagicBytes } from '../../../../utils/imageValidation'
import './AdminDeckCreatePage.css'

function AdminDeckCreatePage({ onNavigate }) {
  const { t } = useTranslation()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCefr, setSelectedCefr] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [coverImage, setCoverImage] = useState('')

  // Meta data
  const [cefrLevels, setCefrLevels] = useState([])
  const [availableTags, setAvailableTags] = useState([])

  // Modal state
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [titleError, setTitleError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const loadMeta = async () => {
      const [cefrRes, tagRes] = await Promise.all([listCefrLevelsApi(), listTagsApi()])
      if (cefrRes.data) setCefrLevels(cefrRes.data)
      if (tagRes.data) setAvailableTags(tagRes.data)
    }
    loadMeta()
  }, [])

  const toggleCefr = (id) => {
    setSelectedCefr((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleTagModalApply = (tags) => {
    setSelectedTags(tags)
  }

  const handleTagsChange = (newTags) => {
    // Đồng bộ danh sách available tags khi modal thực hiện CRUD
    setAvailableTags(newTags)
    // Loại bỏ khỏi selectedTags những tag đã bị xóa
    setSelectedTags((prev) => prev.filter((t) => newTags.find((nt) => nt._id === t._id)))
  }

  const removeTag = (id) => {
    setSelectedTags((prev) => prev.filter((t) => t._id !== id))
  }

  const uploadImage = async (file) => {
    const contentType = file.type || 'image/png'
    const presignedRes = await getPresignedUrl({
      contentType,
      purpose: 'card-image',
      fileSize: file.size
    })

    if (!presignedRes.success || !presignedRes.data?.uploadUrl) {
      throw new Error(presignedRes.message || t('admin.uploadFailed'))
    }

    const { uploadUrl, url } = presignedRes.data
    await uploadAudioToS3(uploadUrl, file, contentType)
    return url
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    // Validate format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg(t('admin.invalidImageFormat') || 'Invalid file format')
      return
    }

    // Validate magic bytes
    const isValidImage = await validateImageMagicBytes(file)
    if (!isValidImage) {
      setErrorMsg(t('admin.invalidImageFile') || 'Invalid image file')
      return
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(t('admin.fileTooLarge') || 'File too large')
      return
    }

    setIsImageUploading(true)
    setErrorMsg('')
    try {
      const url = await uploadImage(file)
      setCoverImage(url)
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message)
    } finally {
      setIsImageUploading(false)
    }
  }

  const handleSubmit = async () => {
    setTitleError('')
    setErrorMsg('')
    setSuccessMsg('')

    if (!title.trim()) {
      setTitleError(t('admin.titleRequired'))
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        cefrLevelIds: selectedCefr,
        tagIds: selectedTags.map((t) => t._id),
        coverImage: coverImage.trim(),
      }
      const res = await createAdminDeckApi(payload)
      if (res.success) {
        setSuccessMsg(t('api.success.DECK_CREATE_SUCCESS'))
        setTimeout(() => {
          if (onNavigate) onNavigate('/admin/decks')
        }, 1200)
      } else {
        setErrorMsg(res.message)
        setIsSubmitting(false)
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-create-page">
      {/* Page Header */}
      <div className="admin-create-page-header">
        <div>
          <h1 className="admin-page-title">{t('admin.createTitle')}</h1>
          <p className="admin-page-subtitle">{t('admin.createSubtitle')}</p>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {errorMsg && <div className="admin-alert error">{errorMsg}</div>}

      {/* Two-column layout */}
      <div className="admin-create-body">
        {/* ── Left Column ── */}
        <div className="admin-create-left">
          {/* Basic Info Section */}
          <div className="admin-create-section">
            <div className="admin-create-section-header">
              <div className="admin-create-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h2 className="admin-create-section-title">{t('admin.sectionBasicInfo')}</h2>
            </div>

            <div className="admin-create-section-body">
              <Input
                id="deck-title"
                label={t('admin.titleLabel').toUpperCase()}
                type="text"
                placeholder={t('admin.titlePlaceholder')}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (titleError) setTitleError('')
                }}
                error={titleError}
              />

              <div className="admin-textarea-group">
                <label htmlFor="deck-desc" className="admin-textarea-label">{t('admin.descLabel').toUpperCase()}</label>
                <textarea
                  id="deck-desc"
                  className="admin-textarea"
                  placeholder={t('admin.descPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Cover Image Section */}
          <div className="admin-create-section">
            <div className="admin-create-section-header">
              <div className="admin-create-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <h2 className="admin-create-section-title">{t('admin.sectionImage')}</h2>
            </div>

            <div className="admin-create-section-body">
              <div className="admin-upload-area">
                {coverImage ? (
                  <img src={coverImage} alt={title || t('admin.sectionImage')} className="admin-upload-preview-image" />
                ) : (
                  <>
                    <div className="admin-upload-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
                        <polyline points="16 16 12 12 8 16" />
                        <line x1="12" y1="12" x2="12" y2="21" />
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      </svg>
                    </div>
                    <p className="admin-upload-hint">{t('admin.imageUploadHint')}</p>
                    <p className="admin-upload-desc">{t('admin.imageUploadDesc')}</p>
                  </>
                )}
                <label className={`admin-upload-action ${isImageUploading ? 'is-uploading' : ''}`}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={isImageUploading} />
                  {isImageUploading ? t('admin.uploading') : (coverImage ? t('admin.changeImage') : t('admin.uploadImage'))}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="admin-create-right">
          <div className="admin-create-section">
            <h2 className="admin-create-classify-title">{t('admin.sectionClassify')}</h2>

            {/* CEFR Level */}
            <div className="admin-classify-group">
              <label className="admin-classify-label">{t('admin.cefrLabel')}</label>
              <div className="admin-cefr-grid">
                {cefrLevels.map((lvl) => (
                  <button
                    key={lvl._id}
                    type="button"
                    className={`admin-cefr-pill ${selectedCefr.includes(lvl._id) ? 'active' : ''}`}
                    onClick={() => toggleCefr(lvl._id)}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="admin-classify-group">
              <label className="admin-classify-label">{t('admin.tagLabel')}</label>

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div className="admin-tag-chips">
                  {selectedTags.map((tag) => (
                    <span key={tag._id} className="admin-tag-chip">
                      {tag.label}
                      <button
                        type="button"
                        className="admin-tag-chip-remove"
                        onClick={() => removeTag(tag._id)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add Tag Button */}
              <button
                type="button"
                className="admin-tag-picker-btn"
                onClick={() => setIsTagModalOpen(true)}
              >
                <span>{t('admin.addTagBtn')}</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="admin-form-footer-actions">
              <button
                className="admin-cancel-btn"
                onClick={() => onNavigate && onNavigate('/admin/decks')}
                disabled={isSubmitting || isImageUploading}
              >
                {t('admin.cancelBtn')}
              </button>
              <button
                className="admin-save-btn"
                onClick={handleSubmit}
                disabled={isSubmitting || isImageUploading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                {isSubmitting ? t('admin.creating') : t('admin.saveBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Picker Modal */}
      <TagPickerModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onApply={handleTagModalApply}
        onTagsChange={handleTagsChange}
      />
    </div>
  )
}

export default AdminDeckCreatePage
