import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '../../../../components/Input/Input'
import TagPickerModal from '../../components/TagPickerModal/TagPickerModal'
import { createAdminLessonApi, listCefrLevelsApi, listTagsApi } from '../../adminApi'
import { getPresignedUrl, uploadAudioToS3 } from '../../../../utils/s3Upload'
import { validateImageMagicBytes } from '../../../../utils/imageValidation'
import '../deck/AdminDeckCreatePage.css'
import './AdminLessonPage.css'

const getYouTubeEmbedUrl = (url) => {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    let videoId = ''

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || ''
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] || ''
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || ''
      }
    }

    if (host === 'youtu.be') {
      videoId = parsed.pathname.slice(1).split('/')[0]
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
  } catch {
    return ''
  }
}

function AdminLessonCreatePage({ onNavigate }) {
  const { t } = useTranslation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [selectedCefr, setSelectedCefr] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [cefrLevels, setCefrLevels] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [titleError, setTitleError] = useState('')
  const [sourceUrlError, setSourceUrlError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const youtubeEmbedUrl = getYouTubeEmbedUrl(sourceUrl)

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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleTagModalApply = (tags) => {
    setSelectedTags(tags)
  }

  const handleTagsChange = (newTags) => {
    setAvailableTags(newTags)
    setSelectedTags((prev) => prev.filter((tag) => newTags.find((item) => item._id === tag._id)))
  }

  const uploadFile = async (file, purpose) => {
    const contentType = file.type || 'image/png'
    const presignedRes = await getPresignedUrl({
      contentType,
      purpose,
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
      const url = await uploadFile(file, 'card-image')
      setThumbnailUrl(url)
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message)
    } finally {
      setIsImageUploading(false)
    }
  }

  const removeTag = (id) => {
    setSelectedTags((prev) => prev.filter((tag) => tag._id !== id))
  }

  const handleSubmit = async () => {
    setTitleError('')
    setSourceUrlError('')
    setErrorMsg('')
    setSuccessMsg('')

    if (!title.trim()) {
      const errMsg = t('admin.lessonTitleRequired')
      setTitleError(errMsg)
      setErrorMsg(errMsg)
      return
    }

    if (!sourceUrl.trim()) {
      const errMsg = t('admin.lessonSourceUrlRequired')
      setSourceUrlError(errMsg)
      setErrorMsg(errMsg)
      return
    }

    if (!getYouTubeEmbedUrl(sourceUrl.trim())) {
      const errMsg = t('api.error.LESSON_SOURCE_URL_INVALID')
      setSourceUrlError(errMsg)
      setErrorMsg(errMsg)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        sourceUrl: sourceUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        cefrLevelIds: selectedCefr,
        tagIds: selectedTags.map((tag) => tag._id),
      }

      const res = await createAdminLessonApi(payload)
      if (res.success) {
        setSuccessMsg(t('api.success.LESSON_CREATED_SUCCESS'))
        setTimeout(() => {
          if (onNavigate) onNavigate('/admin/lessons')
        }, 1200)
      } else {
        setErrorMsg(res.message)
        setIsSubmitting(false)
      }
    } catch (error) {
      const code = error.response?.data?.code
      const msg = code ? t('api.error.' + code) : (error.response?.data?.message || error.message)
      if (code === 'LESSON_SOURCE_URL_INVALID' || code === 'LESSON_SOURCE_URL_REQUIRED' || code === 'LESSON_SOURCE_URL_DISABLED_PLAYBACK') {
        setSourceUrlError(msg)
      } else if (code === 'LESSON_TITLE_REQUIRED') {
        setTitleError(msg)
      }
      setErrorMsg(msg)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="admin-create-page admin-lesson-form-page">
      <div className="admin-create-page-header">
        <div>
          <h1 className="admin-page-title">{t('admin.lessonCreateTitle')}</h1>
          <p className="admin-page-subtitle">{t('admin.lessonCreateSubtitle')}</p>
        </div>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {errorMsg && <div className="admin-alert error">{errorMsg}</div>}

      <div className="admin-create-body">
        <div className="admin-create-left">
          <div className="admin-create-section">
            <div className="admin-create-section-header">
              <div className="admin-create-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h2 className="admin-create-section-title">{t('admin.lessonSectionContent')}</h2>
            </div>
            <div className="admin-create-section-body">
              <Input
                id="lesson-title"
                label={t('admin.lessonTitleLabel').toUpperCase()}
                type="text"
                placeholder={t('admin.lessonTitlePlaceholder')}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (titleError) setTitleError('')
                }}
                error={titleError}
                autoFocus
              />

              <div className="admin-textarea-group">
                <label htmlFor="lesson-desc" className="admin-textarea-label">{t('admin.lessonDescLabel').toUpperCase()}</label>
                <textarea
                  id="lesson-desc"
                  className="admin-textarea admin-lesson-description"
                  placeholder={t('admin.lessonDescPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          </div>

          <div className="admin-create-section">
            <div className="admin-create-section-header">
              <div className="admin-create-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              </div>
              <h2 className="admin-create-section-title">{t('admin.lessonSectionMedia')}</h2>
            </div>
            <div className="admin-create-section-body">
              <Input
                id="lesson-source-url"
                label={t('admin.lessonSourceUrlLabel').toUpperCase()}
                type="text"
                placeholder={t('admin.lessonSourceUrlPlaceholder')}
                value={sourceUrl}
                onChange={(e) => {
                  setSourceUrl(e.target.value)
                  if (sourceUrlError) setSourceUrlError('')
                }}
                error={sourceUrlError}
              />

              <div className="admin-lesson-media-row">
                <div className="admin-upload-area admin-lesson-upload-visual">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={title || t('admin.lessonPreviewAlt')} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <>
                      <div className="admin-upload-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
                          <polyline points="16 16 12 12 8 16" />
                          <line x1="12" y1="12" x2="12" y2="21" />
                          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                        </svg>
                      </div>
                      <p className="admin-upload-hint">{t('admin.lessonThumbnailUploadHint')}</p>
                      <p className="admin-upload-desc">{t('admin.imageUploadDesc')}</p>
                    </>
                  )}
                  <label className={`admin-upload-action ${isImageUploading ? 'is-uploading' : ''}`} style={{ marginTop: thumbnailUrl ? '8px' : '0' }}>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={isImageUploading} />
                    {isImageUploading ? t('admin.uploading') : (thumbnailUrl ? t('admin.changeImage') : t('admin.uploadImage'))}
                  </label>
                </div>

                <div className="admin-lesson-preview">
                  {youtubeEmbedUrl ? (
                    <iframe
                      src={youtubeEmbedUrl}
                      title={title || t('admin.lessonPreviewAlt')}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="admin-lesson-preview-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  {!youtubeEmbedUrl && (
                    <div className="admin-lesson-preview-play">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-create-right">
          <div className="admin-create-section">
            <h2 className="admin-create-classify-title">{t('admin.sectionClassify')}</h2>

            <div className="admin-classify-group">
              <label className="admin-classify-label">{t('admin.cefrLabel')}</label>
              <div className="admin-cefr-grid">
                {cefrLevels.map((level) => (
                  <button
                    key={level._id}
                    type="button"
                    className={`admin-cefr-pill ${selectedCefr.includes(level._id) ? 'active' : ''}`}
                    onClick={() => toggleCefr(level._id)}
                  >
                    {level.label || level.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-classify-group">
              <label className="admin-classify-label">{t('admin.lessonTagLabel')}</label>
              {selectedTags.length > 0 && (
                <div className="admin-tag-chips">
                  {selectedTags.map((tag) => (
                    <span key={tag._id} className="admin-tag-chip">
                      {tag.label}
                      <button type="button" className="admin-tag-chip-remove" onClick={() => removeTag(tag._id)}>
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <button type="button" className="admin-tag-picker-btn" onClick={() => setIsTagModalOpen(true)}>
                <span>{t('admin.addLessonTagBtn')}</span>
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
                onClick={() => onNavigate && onNavigate('/admin/lessons')}
                disabled={isSubmitting || isImageUploading}
              >
                {t('admin.cancelBtn')}
              </button>
              <button className="admin-save-btn" onClick={handleSubmit} disabled={isSubmitting || isImageUploading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                {isSubmitting ? t('admin.creating') : t('admin.lessonSaveBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>

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

export default AdminLessonCreatePage
