import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { patchCardState } from '../flashcardsApi'
import './FlashCard.css'

function FlashCard({ cardItem, mode = 'learn', onSuccess, onHide, onCardStateChange }) {
  const { t, i18n } = useTranslation()
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isStarred, setIsStarred] = useState(false)

  // Reset trạng thái lật khi cardItem thay đổi
  useEffect(() => {
    setIsFlipped(false)
    setError('')
  }, [cardItem])

  if (!cardItem || !cardItem.card) {
    return null
  }

  const { card, userCardState } = cardItem

  // Đồng bộ trạng thái starred khi userCardState thay đổi
  useEffect(() => {
    setIsStarred(userCardState?.flags?.starred || false)
  }, [userCardState])

  const handleStarClick = async (e) => {
    e.stopPropagation()
    setIsSubmitting(true)
    setError('')
    try {
      const nextStarred = !isStarred
      const payload = {
        deckId: card.deckId,
        topicId: card.topicId,
        flags: {
          starred: nextStarred,
          hidden: userCardState?.flags?.hidden || false
        }
      }
      const response = await patchCardState(card._id, payload)
      if (response.success) {
        setIsStarred(nextStarred)
        if (onCardStateChange) {
          onCardStateChange(card._id, response.data)
        }
      } else {
        setError(response.message || t('api.common.UNKNOWN_ERROR'))
      }
    } catch (err) {
      console.error('Lỗi cập nhật star state:', err)
      setError(t('api.common.UNKNOWN_ERROR'))
    } finally {
      setIsSubmitting(false)
    }
  }
  const currentLang = i18n.language === 'vi' ? 'vi' : 'en'

  // Lấy giải thích theo ngôn ngữ hiện tại
  const explanationText = card.explanation?.[currentLang] || card.explanation?.vi || card.explanation?.en || ''

  // Xử lý lật thẻ
  const handleCardClick = () => {
    setIsFlipped((prev) => !prev)
  }

  // Xử lý phát âm audio
  const handleAudioPlay = (e, audioUrl) => {
    e.stopPropagation() // Ngăn lật thẻ khi bấm vào nút âm thanh
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch((err) => console.error('Lỗi phát âm thanh:', err))
    }
  }

  // Xử lý khi nhấn nút đánh giá (Học lại, Khó, Tốt, Dễ)
  const handleGradeClick = async (gradeValue) => {
    setIsSubmitting(true)
    setError('')
    try {
      const payload = {
        deckId: card.deckId,
        topicId: card.topicId,
        srs: {
          lastGrade: gradeValue
        }
      }
      const response = await patchCardState(card._id, payload)
      if (response.success) {
        if (onSuccess) {
          onSuccess(gradeValue, response.data)
        }
      } else {
        setError(response.message || t('api.common.UNKNOWN_ERROR'))
      }
    } catch (err) {
      console.error('Lỗi cập nhật card state:', err)
      setError(t('api.common.UNKNOWN_ERROR'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Xử lý ẩn thẻ (chỉ cho chế độ ôn tập)
  const handleHideClick = (e) => {
    e.stopPropagation() // Ngăn lật thẻ khi bấm vào nút ẩn
    if (onHide) {
      onHide(cardItem)
    }
  }

  return (
    <div className="flashcard-widget-wrapper">
      {error && <div className="flashcard-error-toast">{error}</div>}

      <div
        className={`flashcard-card ${isFlipped ? 'flipped' : ''}`}
        onClick={handleCardClick}
      >
        <div className="flashcard-card-inner">

          {/* MẶT TRƯỚC */}
          <div className="flashcard-face flashcard-front">
            {/* Nút Lưu (Star) ở góc trái trên cùng */}
            <button
              className={`flashcard-star-btn ${isStarred ? 'starred' : ''}`}
              onClick={handleStarClick}
              disabled={isSubmitting}
              title={isStarred ? 'Starred' : 'Star'}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill={isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>

            {/* Nút Ẩn thẻ (chỉ hiển thị ở chế độ ôn tập và nằm ở góc phải trên cùng) */}
            {mode === 'review' && (
              <button
                className="flashcard-hide-btn"
                onClick={handleHideClick}
                disabled={isSubmitting}
                title={t('flashcard.hideCard')}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            )}

            {/* Hình ảnh minh họa */}
            {card.imageUrl && (
              <div className="flashcard-image-container">
                <img
                  src={card.imageUrl}
                  alt={card.term}
                  className="flashcard-image"
                  loading="lazy"
                />
              </div>
            )}

            {/* Từ vựng & Phát âm */}
            <div className="flashcard-front-content">
              <div className="flashcard-term-row">
                <h2 className="flashcard-term">{card.term}</h2>

                {/* Các nút phát âm giọng US/UK */}
                <div className="flashcard-audio-group">
                  {card.phonetics?.map((phonetic, index) => {
                    const isUS = phonetic.locale?.toLowerCase().includes('us');
                    const isUK = phonetic.locale?.toLowerCase().includes('uk') || phonetic.locale?.toLowerCase().includes('gb');
                    const label = isUS ? 'US' : (isUK ? 'UK' : '');
                    return phonetic.audio ? (
                      <button
                        key={index}
                        className="flashcard-speaker-btn"
                        onClick={(e) => handleAudioPlay(e, phonetic.audio)}
                        title={label ? `${label} Pronunciation` : 'Pronunciation'}
                        aria-label="Play audio"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        {label && <span className="flashcard-audio-label">{label}</span>}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Loại từ & Phiên âm */}
              <p className="flashcard-meta">
                {card.pos && <span className="flashcard-pos">({card.pos})</span>}
                {card.phonetics?.map((phonetic, index) => {
                  const isUS = phonetic.locale?.toLowerCase().includes('us');
                  const isUK = phonetic.locale?.toLowerCase().includes('uk') || phonetic.locale?.toLowerCase().includes('gb');
                  const label = isUS ? 'US' : (isUK ? 'UK' : '');
                  return phonetic.text ? (
                    <span key={index} className="flashcard-phonetic-wrapper">
                      {label && <span className="flashcard-phonetic-locale">{label}</span>}
                      <span className="flashcard-phonetic">{phonetic.text}</span>
                    </span>
                  ) : null;
                })}
              </p>

              {/* Gợi ý lật thẻ */}
              <div className="flashcard-hint-text">
                {t('flashcard.tapToSeeMeaning')}
              </div>
            </div>
          </div>

          {/* MẶT SAU */}
          <div className="flashcard-face flashcard-back">
            <div className="flashcard-back-content">
              {/* Định nghĩa & Giải thích */}
              <h2 className="flashcard-translation">{card.translation}</h2>
              {explanationText && <p className="flashcard-explanation">{explanationText}</p>}

              {/* Ví dụ */}
              {(card.examples?.en || card.examples?.vi) && (
                <div className="flashcard-examples-container">
                  <span className="flashcard-example-title">{t('flashcard.example')}</span>
                  {card.examples?.en && (
                    <p className="flashcard-example-en">"{card.examples.en}"</p>
                  )}
                  {card.examples?.vi && (
                    <p className="flashcard-example-vi">{card.examples.vi}</p>
                  )}
                </div>
              )}

              {/* Gợi ý lật thẻ */}
              <div className="flashcard-hint-text">
                {t('flashcard.tapToGoBack')}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4 Nút đánh giá ở phía dưới (Chỉ hiện khi lật sang mặt sau) */}
      <div className={`flashcard-actions ${isFlipped ? 'visible' : ''}`}>

        {/* Nút Học lại (Grade 0) */}
        <button
          className="flashcard-action-btn btn-again"
          onClick={() => handleGradeClick(0)}
          disabled={isSubmitting}
        >
          <div className="flashcard-btn-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </div>
          <span className="flashcard-btn-label">{t('flashcard.gradeAgain')}</span>
        </button>

        {/* Nút Khó (Grade 1) */}
        <button
          className="flashcard-action-btn btn-hard"
          onClick={() => handleGradeClick(1)}
          disabled={isSubmitting}
        >
          <div className="flashcard-btn-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 15h8" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <span className="flashcard-btn-label">{t('flashcard.gradeHard')}</span>
        </button>

        {/* Nút Tốt (Grade 2) */}
        <button
          className="flashcard-action-btn btn-good"
          onClick={() => handleGradeClick(2)}
          disabled={isSubmitting}
        >
          <div className="flashcard-btn-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <span className="flashcard-btn-label">{t('flashcard.gradeGood')}</span>
        </button>

        {/* Nút Dễ (Grade 3) */}
        <button
          className="flashcard-action-btn btn-easy"
          onClick={() => handleGradeClick(3)}
          disabled={isSubmitting}
        >
          <div className="flashcard-btn-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 13.5s1.5 2.5 4 2.5 4-2.5 4-2.5" />
              <path d="M9 10a1.5 1.5 0 0 0-3 0M18 10a1.5 1.5 0 0 0-3 0" />
            </svg>
          </div>
          <span className="flashcard-btn-label">{t('flashcard.gradeEasy')}</span>
        </button>

      </div>
    </div>
  )
}

export default FlashCard
