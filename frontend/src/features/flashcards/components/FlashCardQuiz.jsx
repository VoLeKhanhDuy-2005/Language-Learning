import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { patchCardState } from '../flashcardsApi'
import './FlashCardQuiz.css'

function FlashCardQuiz({ cardItem, mode = 'learn', onSuccess, onHide, onCardStateChange }) {
  const { t, i18n } = useTranslation()
  const [selectedOption, setSelectedOption] = useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isStarred, setIsStarred] = useState(false)

  // Reset trạng thái khi card thay đổi
  useEffect(() => {
    setSelectedOption(null)
    setIsSubmitted(false)
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
      console.error('Lỗi cập nhật star state trong quiz:', err)
      setError(t('api.common.UNKNOWN_ERROR'))
    } finally {
      setIsSubmitting(false)
    }
  }
  const currentLang = i18n.language === 'vi' ? 'vi' : 'en'

  // Lấy giải thích theo ngôn ngữ hiện tại
  const explanationText = card.explanation?.[currentLang] || card.explanation?.vi || card.explanation?.en || ''

  // Xử lý chọn đáp án
  const handleOptionSelect = (option) => {
    if (isSubmitted) return
    setSelectedOption(option)
    setIsSubmitted(true)
  }

  // Xử lý phát âm audio thủ công
  const handleAudioPlay = (e, audioUrl) => {
    e.stopPropagation()
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch((err) => console.error('Lỗi phát âm thanh:', err))
    }
  }

  // Xử lý cập nhật trạng thái học srs (Học lại, Khó, Tốt, Dễ)
  const handleGradeClick = async (gradeValue) => {
    setIsSubmitting(true)
    setError('')
    try {
      const payload = {
        deckId: card.deckId,
        topicId: card.topicId,
        srs: {
          lastGrade: gradeValue
        },
        flags: {
          starred: userCardState?.flags?.starred || false,
          hidden: userCardState?.flags?.hidden || false
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
      console.error('Lỗi cập nhật card state trong quiz:', err)
      setError(t('api.common.UNKNOWN_ERROR'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Xử lý ẩn thẻ (chỉ cho chế độ ôn tập)
  const handleHideClick = (e) => {
    e.stopPropagation()
    if (onHide) {
      onHide(cardItem)
    }
  }

  return (
    <div className="quiz-widget-wrapper">
      {error && <div className="quiz-error-toast">{error}</div>}

      {/* Card Trắc Nghiệm */}
      <div className="quiz-card-container">

        {/* Nút Lưu (Star) ở góc trái trên cùng */}
        <button
          className={`quiz-star-btn ${isStarred ? 'starred' : ''}`}
          onClick={handleStarClick}
          disabled={isSubmitting}
          title={isStarred ? 'Starred' : 'Star'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill={isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>

        {/* Nút Ẩn thẻ (Chỉ ở chế độ review và nằm ở góc phải) */}
        {mode === 'review' && (
          <button
            className="quiz-hide-btn"
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

        {/* NỘI DUNG CÂU HỎI */}
        <div className="quiz-question-section">
          <span className="quiz-badge">{t('quiz.questionTitle')}</span>
          <h2 className="quiz-translation-term">{card.translation}</h2>
          {explanationText && <p className="quiz-explanation-text">{explanationText}</p>}
        </div>

        {/* 4 ĐÁP ÁN TRẮC NGHIỆM */}
        <div className="quiz-options-grid">
          {card.quizOptions?.map((option, index) => {
            const isSelected = selectedOption?.word === option.word
            let btnClass = ''
            if (isSubmitted) {
              if (option.isCorrect) {
                btnClass = 'correct' // Đáp án đúng tô xanh lá
              } else if (isSelected && !option.isCorrect) {
                btnClass = 'incorrect' // Người dùng chọn sai tô đỏ
              } else {
                btnClass = 'disabled'
              }
            }

            return (
              <button
                key={index}
                className={`quiz-option-btn ${btnClass}`}
                onClick={() => handleOptionSelect(option)}
                disabled={isSubmitted}
              >
                <span className="option-indicator">{String.fromCharCode(65 + index)}</span>
                <span className="option-word">{option.word}</span>
                {isSubmitted && option.isCorrect && (
                  <svg className="option-feedback-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
                {isSubmitted && isSelected && !option.isCorrect && (
                  <svg className="option-feedback-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {/* PHẢN HỒI VÀ THÔNG TIN CHI TIẾT TỪ VỰNG (Chỉ hiện sau khi đã chọn xong đáp án) */}
        {isSubmitted && (
          <div className="quiz-details-section">
            <div className="details-divider"></div>

            <div className="details-header">{t('quiz.detailsTitle')}</div>

            {/* Chi tiết từ vựng tương tự mặt trước/mặt sau của FlashCard */}
            <div className="quiz-vocabulary-details">

              {/* Từ vựng & Audio */}
              <div className="details-term-row">
                <h3 className="details-term">{card.term}</h3>

                <div className="details-audio-group">
                  {card.phonetics?.map((phonetic, index) => {
                    const isUS = phonetic.locale?.toLowerCase().includes('us');
                    const isUK = phonetic.locale?.toLowerCase().includes('uk') || phonetic.locale?.toLowerCase().includes('gb');
                    const label = isUS ? 'US' : (isUK ? 'UK' : '');
                    return phonetic.audio ? (
                      <button
                        key={index}
                        className="details-speaker-btn"
                        onClick={(e) => handleAudioPlay(e, phonetic.audio)}
                        title={label ? `${label} Pronunciation` : 'Pronunciation'}
                        aria-label="Play audio"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        {label && <span className="details-audio-label">{label}</span>}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Loại từ & Phiên âm */}
              <p className="details-meta">
                {card.pos && <span className="details-pos">({card.pos})</span>}
                {card.phonetics?.map((phonetic, index) => {
                  const isUS = phonetic.locale?.toLowerCase().includes('us');
                  const isUK = phonetic.locale?.toLowerCase().includes('uk') || phonetic.locale?.toLowerCase().includes('gb');
                  const label = isUS ? 'US' : (isUK ? 'UK' : '');
                  return phonetic.text ? (
                    <span key={index} className="details-phonetic-wrapper">
                      {label && <span className="details-phonetic-locale">{label}</span>}
                      <span className="details-phonetic">{phonetic.text}</span>
                    </span>
                  ) : null;
                })}
              </p>

              {/* Ví dụ */}
              {(card.examples?.en || card.examples?.vi) && (
                <div className="details-examples-box">
                  <span className="example-box-title">{t('flashcard.example')}</span>
                  {card.examples?.en && (
                    <p className="example-box-en">"{card.examples.en}"</p>
                  )}
                  {card.examples?.vi && (
                    <p className="example-box-vi">{card.examples.vi}</p>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* 4 NÚT SRS ĐÁNH GIÁ (Chỉ hiển thị sau khi đã chọn đáp án xong) */}
      <div className={`quiz-actions ${isSubmitted ? 'visible' : ''}`}>

        {/* Nút Học lại (Grade 0) */}
        <button
          className="quiz-action-btn btn-again"
          onClick={() => handleGradeClick(0)}
          disabled={isSubmitting}
        >
          <div className="quiz-btn-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </div>
          <span className="quiz-btn-label">{t('flashcard.gradeAgain')}</span>
        </button>

        {/* Nút Khó (Grade 1) */}
        <button
          className="quiz-action-btn btn-hard"
          onClick={() => handleGradeClick(1)}
          disabled={isSubmitting}
        >
          <div className="quiz-btn-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 15h8" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <span className="quiz-btn-label">{t('flashcard.gradeHard')}</span>
        </button>

        {/* Nút Tốt (Grade 2) */}
        <button
          className="quiz-action-btn btn-good"
          onClick={() => handleGradeClick(2)}
          disabled={isSubmitting}
        >
          <div className="quiz-btn-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <span className="quiz-btn-label">{t('flashcard.gradeGood')}</span>
        </button>

        {/* Nút Dễ (Grade 3) */}
        <button
          className="quiz-action-btn btn-easy"
          onClick={() => handleGradeClick(3)}
          disabled={isSubmitting}
        >
          <div className="quiz-btn-icon-circle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 13.5s1.5 2.5 4 2.5 4-2.5 4-2.5" />
              <path d="M9 10a1.5 1.5 0 0 0-3 0M18 10a1.5 1.5 0 0 0-3 0" />
            </svg>
          </div>
          <span className="quiz-btn-label">{t('flashcard.gradeEasy')}</span>
        </button>

      </div>
    </div>
  )
}

export default FlashCardQuiz
