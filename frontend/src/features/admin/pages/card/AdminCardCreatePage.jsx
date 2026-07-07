import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '../../../../components/Input/Input'
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal'
import { getPresignedUrl, uploadAudioToS3 } from '../../../../utils/s3Upload'
import { validateImageMagicBytes } from '../../../../utils/imageValidation'
import {
  autoFillCardApi,
  createDeckCardApi,
  getAdminDeckByIdApi,
  getDeckTopicsApi
} from '../../adminApi'
import './AdminCardFormPage.css'

const POS_OPTIONS = [
  'adjective',
  'adverb',
  'auxiliary verb',
  'collocation',
  'conjunction',
  'determiner',
  'idiom',
  'interjection',
  'modal verb',
  'noun',
  'phrasal verb',
  'phrase',
  'preposition',
  'pronoun',
  'verb'
]

const emptyPhoneticDraft = { text: '', locale: 'en-US', audio: '', fileName: '' }

function AdminCardCreatePage({ deckId, topicId, onNavigate }) {
  const { t } = useTranslation()
  const [deck, setDeck] = useState(null)
  const [topic, setTopic] = useState(null)
  const [form, setForm] = useState({
    term: '',
    pos: 'adjective',
    translation: '',
    phonetics: [],
    explanationEn: '',
    explanationVi: '',
    exampleEn: '',
    exampleVi: '',
    imageUrl: ''
  })
  const [phoneticDraft, setPhoneticDraft] = useState(emptyPhoneticDraft)
  const [editingPronunciationIndex, setEditingPronunciationIndex] = useState(null)
  const [pronunciationDeleteIndex, setPronunciationDeleteIndex] = useState(null)
  const [isPronunciationModalOpen, setIsPronunciationModalOpen] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [isAudioUploading, setIsAudioUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [playingAudioIndex, setPlayingAudioIndex] = useState(null)
  const [audioElement, setAudioElement] = useState(null)

  useEffect(() => {
    const loadMeta = async () => {
      try {
        setLoading(true)
        const [deckRes, topicsRes] = await Promise.all([
          getAdminDeckByIdApi(deckId),
          getDeckTopicsApi(deckId)
        ])
        setDeck(deckRes.data)
        setTopic((topicsRes.data || []).find((item) => item._id === topicId) || null)
      } catch (error) {
        setErrorMsg(error.response?.data?.message || error.message)
      } finally {
        setLoading(false)
      }
    }

    if (deckId && topicId) loadMeta()
  }, [deckId, topicId])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const buildPayload = () => ({
    topicId,
    term: form.term.trim(),
    pos: form.pos,
    translation: form.translation.trim(),
    phonetics: form.phonetics.map(({ text, locale, audio }) => ({
      text: text.trim(),
      locale: locale.trim(),
      audio: audio.trim()
    })),
    explanation: {
      en: form.explanationEn.trim(),
      vi: form.explanationVi.trim()
    },
    examples: {
      en: form.exampleEn.trim(),
      vi: form.exampleVi.trim()
    },
    imageUrl: form.imageUrl
  })

  const uploadFile = async (file, purpose) => {
    const contentType = file.type || (purpose === 'card-image' ? 'image/png' : 'audio/wav')
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
      updateField('imageUrl', url)
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message)
    } finally {
      setIsImageUploading(false)
    }
  }

  const handleAudioUpload = async (file) => {
    if (!file) return

    setIsAudioUploading(true)
    setErrorMsg('')
    try {
      const url = await uploadFile(file, 'shadowing-audio')
      setPhoneticDraft((prev) => ({ ...prev, audio: url, fileName: file.name }))
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message)
    } finally {
      setIsAudioUploading(false)
    }
  }

  const handlePlayAudio = (index) => {
    const phonetic = form.phonetics[index]
    if (!phonetic.audio) return

    // Dừng audio đang phát nếu có
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
    }

    // Phát audio mới
    const audio = new Audio(phonetic.audio)
    audio.play()
    setPlayingAudioIndex(index)
    setAudioElement(audio)

    audio.onended = () => {
      setPlayingAudioIndex(null)
      setAudioElement(null)
    }

    audio.onerror = () => {
      setErrorMsg(t('admin.audioPlayFailed'))
      setPlayingAudioIndex(null)
      setAudioElement(null)
    }
  }

  const handleAutoFill = async () => {
    const word = form.term.trim() || form.translation.trim()
    if (!word) {
      setErrors((prev) => ({ ...prev, term: t('admin.cardAutoFillRequired') }))
      return
    }

    setIsAutoFilling(true)
    setErrorMsg('')
    try {
      const res = await autoFillCardApi(word)
      const data = res.data || {}
      setForm((prev) => ({
        ...prev,
        term: data.term || prev.term,
        pos: data.pos || prev.pos,
        translation: data.translation || prev.translation,
        phonetics: (data.phonetics || []).map((item) => ({
          text: item.text || '',
          locale: item.locale || 'en-US',
          audio: item.audio || '',
          fileName: ''
        })),
        explanationEn: data.explanation?.en || prev.explanationEn,
        explanationVi: data.explanation?.vi || prev.explanationVi,
        exampleEn: data.examples?.en || prev.exampleEn,
        exampleVi: data.examples?.vi || prev.exampleVi
      }))
      setErrors({})
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message)
    } finally {
      setIsAutoFilling(false)
    }
  }

  const openPronunciationModal = () => {
    setPhoneticDraft(emptyPhoneticDraft)
    setEditingPronunciationIndex(null)
    setIsPronunciationModalOpen(true)
  }

  const openEditPronunciationModal = (index) => {
    const phonetic = form.phonetics[index] || emptyPhoneticDraft
    
    // Nếu có audio URL nhưng không có fileName, extract từ URL
    let fileName = phonetic.fileName || ''
    if (!fileName && phonetic.audio) {
      try {
        const url = new URL(phonetic.audio)
        fileName = url.pathname.split('/').pop() || ''
      } catch {
        fileName = phonetic.audio.split('/').pop() || ''
      }
    }
    
    setPhoneticDraft({
      ...phonetic,
      fileName
    })
    setEditingPronunciationIndex(index)
    setIsPronunciationModalOpen(true)
  }

  const savePronunciation = () => {
    if (!phoneticDraft.text.trim() && !phoneticDraft.fileName) return
    setForm((prev) => ({
      ...prev,
      phonetics: editingPronunciationIndex === null
        ? [...prev.phonetics, { ...phoneticDraft }]
        : prev.phonetics.map((item, index) =>
            index === editingPronunciationIndex ? { ...item, ...phoneticDraft } : item
          )
    }))
    setIsPronunciationModalOpen(false)
    setEditingPronunciationIndex(null)
    setPhoneticDraft(emptyPhoneticDraft)
  }

  const confirmRemovePronunciation = () => {
    if (pronunciationDeleteIndex === null) return
    setForm((prev) => ({
      ...prev,
      phonetics: prev.phonetics.filter((_, itemIndex) => itemIndex !== pronunciationDeleteIndex)
    }))
    setPronunciationDeleteIndex(null)
  }

  const handleSubmit = async () => {
    const nextErrors = {}
    if (!form.term.trim()) nextErrors.term = t('admin.cardTermRequired')
    if (!form.translation.trim()) nextErrors.translation = t('admin.cardTranslationRequired')
    if (!form.pos) nextErrors.pos = t('admin.cardPosRequired')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await createDeckCardApi(deckId, buildPayload())
      setSuccessMsg(t('api.success.CARD_CREATE_SUCCESS'))
      setTimeout(() => onNavigate(`/admin/decks/${deckId}/topics/${topicId}/cards`), 900)
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message)
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
        <span>{t('admin.loading')}</span>
      </div>
    )
  }

  return (
    <div className="admin-card-form-page">
      <div className="admin-card-form-top">
        <div>
          <div className="admin-breadcrumbs">
            <span className="breadcrumb-link" onClick={() => onNavigate('/admin/decks')}>{t('admin.decksBreadcrumb')}</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-link" onClick={() => onNavigate(`/admin/decks/${deckId}`)}>{deck?.title || t('admin.deckNotFound')}</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-link" onClick={() => onNavigate(`/admin/decks/${deckId}/topics/${topicId}/cards`)}>{topic?.name || t('admin.topicDetail')}</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-active">{t('admin.cardCreateTitle')}</span>
          </div>
          <h1 className="admin-card-form-title">{t('admin.cardCreateTitle')}</h1>
        </div>

        <div className="admin-card-form-actions">
          <button type="button" className="admin-card-cancel-btn" onClick={() => onNavigate(`/admin/decks/${deckId}/topics/${topicId}/cards`)} disabled={isSubmitting}>
            {t('admin.cancelBtn')}
          </button>
          <button type="button" className="admin-card-save-btn" onClick={handleSubmit} disabled={isSubmitting || isImageUploading || isAudioUploading}>
            {isSubmitting ? t('admin.saving') : t('admin.saveChangesBtn')}
          </button>
        </div>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {errorMsg && <div className="admin-alert error">{errorMsg}</div>}

      <div className="admin-card-form-grid">
        <section className="admin-card-form-panel">
          <h2>{t('admin.cardInfoSection')}</h2>
          <Input
            id="card-term"
            label={t('admin.cardTermLabel').toUpperCase()}
            placeholder="Resilient"
            value={form.term}
            onChange={(event) => updateField('term', event.target.value)}
            error={errors.term}
            rightElement={
              <button type="button" className="admin-card-ai-btn" onClick={handleAutoFill} disabled={isAutoFilling}>
                <span>✦</span>
                {isAutoFilling ? t('admin.cardAutoFilling') : t('admin.cardAutoFill')}
              </button>
            }
          />

          <label className="admin-card-field">
            <span>{t('admin.cardPosLabel')}</span>
            <select value={form.pos} onChange={(event) => updateField('pos', event.target.value)} className={errors.pos ? 'has-error' : ''}>
              {POS_OPTIONS.map((pos) => <option key={pos} value={pos}>{t(`admin.${posToKey(pos)}`)}</option>)}
            </select>
            {errors.pos && <small>{errors.pos}</small>}
          </label>

          <div className="admin-card-image-box">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt={form.term || t('admin.cardImageAlt')} />
            ) : (
              <div className="admin-card-image-placeholder">
                <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
            <label className={`admin-card-upload-btn ${isImageUploading ? 'is-uploading' : ''}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={isImageUploading} />
              {isImageUploading ? t('admin.uploading') : (form.imageUrl ? t('admin.changeImage') : t('admin.uploadImage'))}
            </label>
            <p>{t('admin.cardImageHint')}</p>
          </div>
        </section>

        <section className="admin-card-form-panel admin-card-detail-panel">
          <h2>{t('admin.cardDetailSection')}</h2>
          <Input
            id="card-translation"
            label={t('admin.cardTranslationLabel').toUpperCase()}
            placeholder={t('admin.cardTranslationPlaceholder')}
            value={form.translation}
            onChange={(event) => updateField('translation', event.target.value)}
            error={errors.translation}
          />

          <div className="admin-card-two-columns">
            <label className="admin-card-field"><span>{t('admin.cardExplanationEnLabel')}</span><textarea value={form.explanationEn} onChange={(event) => updateField('explanationEn', event.target.value)} rows={4} placeholder="Able to be happy, successful, etc. again after something difficult or bad has happened." /></label>
            <label className="admin-card-field"><span>{t('admin.cardExplanationViLabel')}</span><textarea value={form.explanationVi} onChange={(event) => updateField('explanationVi', event.target.value)} rows={4} placeholder="Khả năng nhanh chóng hồi phục..." /></label>
          </div>

          <div className="admin-card-pronunciation">
            <div className="admin-card-section-label">
              <span>{t('admin.cardPronunciationTitle')}</span>
              <button type="button" className="admin-card-add-pronunciation-btn" onClick={openPronunciationModal}>
                <span>+</span>
                {t('admin.cardAddPronunciation')}
              </button>
            </div>

            {form.phonetics.length > 0 && (
              <div className="admin-card-pronunciation-list">
                {form.phonetics.map((phonetic, index) => (
                  <div className="admin-card-pronunciation-item" key={`${phonetic.text}-${index}`}>
                    <div><span>{t('admin.cardIpaLabel')}</span><strong>{phonetic.text || '-'}</strong></div>
                    <div><span>{t('admin.cardLocaleLabel')}</span><strong>{phonetic.locale || '-'}</strong></div>
                    <div><span>{t('admin.cardAudioLabel')}</span><strong>{phonetic.fileName || phonetic.audio || t('admin.cardNoAudio')}</strong></div>
                    <button 
                      type="button" 
                      className="admin-card-play-btn" 
                      onClick={() => handlePlayAudio(index)}
                      disabled={!phonetic.audio || playingAudioIndex === index}
                      aria-label={t('admin.cardPlayAudio')}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                    <button type="button" className="admin-card-edit-pronunciation-btn" onClick={() => openEditPronunciationModal(index)} aria-label={t('admin.cardEditPronunciation')}>
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                    <button type="button" className="admin-card-delete-pronunciation-btn" onClick={() => setPronunciationDeleteIndex(index)} aria-label={t('admin.cardDeletePronunciation')}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card-examples">
            <span className="admin-card-section-label-text">{t('admin.cardExampleTitle')}</span>
            <label className="admin-card-field"><span>{t('admin.cardExampleEnLabel')}</span><textarea rows={3} value={form.exampleEn} onChange={(event) => updateField('exampleEn', event.target.value)} placeholder='"She is a resilient girl - she won’t be unhappy for long."' /></label>
            <label className="admin-card-field"><span>{t('admin.cardExampleViLabel')}</span><textarea rows={3} value={form.exampleVi} onChange={(event) => updateField('exampleVi', event.target.value)} placeholder='"Cô ấy là một cô gái kiên cường..."' /></label>
          </div>
        </section>
      </div>

      {isPronunciationModalOpen && (
        <PronunciationModal
          draft={phoneticDraft}
          setDraft={setPhoneticDraft}
          onCancel={() => {
            setIsPronunciationModalOpen(false)
            setEditingPronunciationIndex(null)
          }}
          onConfirm={savePronunciation}
          isEditing={editingPronunciationIndex !== null}
          isUploading={isAudioUploading}
          onAudioUpload={handleAudioUpload}
          t={t}
        />
      )}

      <ConfirmModal
        isOpen={pronunciationDeleteIndex !== null}
        title={t('admin.confirmDeletePronunciationTitle')}
        message={t('admin.confirmDeletePronunciationMessage')}
        confirmText={t('admin.deleteBtn')}
        cancelText={t('admin.cancelBtn')}
        onConfirm={confirmRemovePronunciation}
        onCancel={() => setPronunciationDeleteIndex(null)}
        isDanger={true}
      />
    </div>
  )
}

function PronunciationModal({ draft, setDraft, onCancel, onConfirm, isEditing, isUploading, onAudioUpload, t }) {
  return (
    <div className="admin-card-modal-backdrop">
      <div className="admin-card-pronunciation-modal">
        <div className="admin-card-modal-header">
          <h3>{isEditing ? t('admin.cardEditPronunciation') : t('admin.cardAddPronunciation')}</h3>
          <button type="button" onClick={onCancel} aria-label={t('admin.cancelBtn')}>×</button>
        </div>
        <div className="admin-card-modal-body">
          <label className="admin-card-field"><span>{t('admin.cardIpaLabel')}</span><input value={draft.text} onChange={(event) => setDraft((prev) => ({ ...prev, text: event.target.value }))} placeholder="/rɪˈzɪliənt/" /></label>
          <label className="admin-card-field"><span>{t('admin.cardLocaleLabel')}</span><input value={draft.locale} onChange={(event) => setDraft((prev) => ({ ...prev, locale: event.target.value }))} placeholder="en-US" /></label>
          <div className="admin-card-field">
            <span>{t('admin.cardAudioLabel')}</span>
            <label className={`admin-card-audio-upload ${isUploading ? 'is-uploading' : ''}`}>
              <input
                type="file"
                accept="audio/webm,audio/mpeg,audio/mp4,audio/wav,audio/ogg"
                disabled={isUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  onAudioUpload(file)
                }}
              />
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {isUploading ? t('admin.uploading') : (draft.fileName || t('admin.cardUploadAudio'))}
            </label>
          </div>
        </div>
        <div className="admin-card-modal-actions">
          <button type="button" className="admin-card-cancel-btn" onClick={onCancel}>{t('admin.cancelBtn')}</button>
          <button type="button" className="admin-card-save-btn" onClick={onConfirm} disabled={isUploading}>{t('admin.applyBtn')}</button>
        </div>
      </div>
    </div>
  )
}

function posToKey(pos) {
  return `pos${pos.split(' ').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')}`
}

export default AdminCardCreatePage
