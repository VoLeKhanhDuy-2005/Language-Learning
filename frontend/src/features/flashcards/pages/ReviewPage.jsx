import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getUserDueCardStates, patchCardState } from '../flashcardsApi'
import FlashCard from '../components/FlashCard'
import FlashCardQuiz from '../components/FlashCardQuiz'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import './ReviewPage.css'

function ReviewPage({ onNavigate }) {
  const { t } = useTranslation()
  const [cardStates, setCardStates] = useState([])
  const [cards, setCards] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [studyMode, setStudyMode] = useState('flashcard') // 'flashcard' hoặc 'quiz'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Trạng thái modal xác nhận ẩn thẻ
  const [isConfirmHideOpen, setIsConfirmHideOpen] = useState(false)
  const [targetHideCard, setTargetHideCard] = useState(null)
  const [isHiding, setIsHiding] = useState(false)

  // Tải danh sách thẻ đến hạn ôn tập
  useEffect(() => {
    const fetchDueCards = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getUserDueCardStates({ due: true, limit: 100, hidden: false })
        if (response.success) {
          const list = response.data || []
          setCardStates(list)

          // Định dạng lại các item để truyền vào FlashCard và FlashCardQuiz
          // cấu trúc: { card: state.cardId, userCardState: state }
          const formatted = list.map((state) => ({
            card: state.cardId,
            userCardState: state
          }))
          setCards(formatted)
          setCurrentCardIndex(0)
        } else {
          setError(response.message || t('review.errorLoad'))
        }
      } catch (err) {
        console.error('Lỗi khi tải thẻ ôn tập:', err)
        setError(t('review.errorLoad'))
      } finally {
        setLoading(false)
      }
    }

    fetchDueCards()
  }, [t])

  // Xử lý khi ôn tập thành công 1 thẻ từ (grade hoặc ẩn thành công)
  const handleCardSuccess = (gradeOrAction) => {
    // Chuyển sang thẻ tiếp theo
    setCurrentCardIndex((prev) => prev + 1)
  }

  // Yêu cầu ẩn thẻ - mở modal xác nhận
  const handleRequestHide = (cardItem) => {
    setTargetHideCard(cardItem)
    setIsConfirmHideOpen(true)
  }

  // Xác nhận ẩn thẻ
  const handleConfirmHide = async () => {
    if (!targetHideCard) return
    setIsHiding(true)
    try {
      const card = targetHideCard.card
      const userCardState = targetHideCard.userCardState
      const payload = {
        flags: {
          starred: userCardState?.flags?.starred || false,
          hidden: true
        }
      }
      const response = await patchCardState(card._id, payload)
      if (response.success) {
        // Ẩn thành công, chuyển sang thẻ tiếp theo
        handleCardSuccess('hide')
      } else {
        setError(response.message || t('api.common.UNKNOWN_ERROR'))
      }
    } catch (err) {
      console.error('Lỗi ẩn thẻ từ vựng:', err)
      setError(t('api.common.UNKNOWN_ERROR'))
    } finally {
      setIsHiding(false)
      setIsConfirmHideOpen(false)
      setTargetHideCard(null)
    }
  }

  // Hủy ẩn thẻ
  const handleCancelHide = () => {
    setIsConfirmHideOpen(false)
    setTargetHideCard(null)
  }

  // Cập nhật userCardState cho thẻ khi có thay đổi (ví dụ: đánh dấu sao)
  const handleCardStateChange = (cardId, updatedState) => {
    setCards((prevCards) =>
      prevCards.map((item) => {
        if (item.card._id === cardId) {
          return {
            ...item,
            userCardState: updatedState
          }
        }
        return item
      })
    )
  }

  const handleBackClick = (e) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate('/decks')
    }
  }

  if (loading) {
    return (
      <div className="review-loading-screen">
        <div className="review-spinner"></div>
        <p>{t('review.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="review-error-screen">
        <p className="error-text">{error}</p>
        <button onClick={handleBackClick} className="btn-back">
          {t('review.backToVocabulary')}
        </button>
      </div>
    )
  }

  const totalCards = cards.length
  const progressPct = totalCards > 0
    ? Math.round((currentCardIndex / totalCards) * 100)
    : 0

  return (
    <div className="review-container">
      {/* Header góc trên */}
      <div className="review-header-row">
        <div className="review-title-wrapper">
          <div className="review-title-info">
            <h1 className="review-name">{t('review.title')}</h1>
            {totalCards > 0 && currentCardIndex < totalCards && (
              <span className="review-due-subtitle">
                {t('review.dueCount', { count: totalCards - currentCardIndex })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Layout ôn tập chính (Căn giữa, không có sidebar bên trái) */}
      <div className="review-layout">
        <main className="review-content-area">
          {totalCards > 0 ? (
            <div className="study-section-wrapper">

              {/* Thanh tiến độ chính lớn phía trên */}
              <div className="main-progress-section">
                <div className="main-progress-info">
                  <span className="main-progress-percent">
                    {progressPct}% {t('review.completed')}
                  </span>
                </div>
                <div className="main-progress-bar">
                  <div
                    className="main-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Chuyển đổi 2 chế độ học */}
              {currentCardIndex < totalCards && (
                <div className="study-mode-switch-wrapper">
                  <span className="study-mode-label">{t('review.studyMode')}</span>
                  <div className="mode-toggle-buttons">
                    <button
                      className={`mode-btn ${studyMode === 'flashcard' ? 'active' : ''}`}
                      onClick={() => setStudyMode('flashcard')}
                    >
                      FlashCard
                    </button>
                    <button
                      className={`mode-btn ${studyMode === 'quiz' ? 'active' : ''}`}
                      onClick={() => setStudyMode('quiz')}
                    >
                      Quiz
                    </button>
                  </div>
                </div>
              )}

              {/* Phần học thẻ */}
              <div className="study-card-render-zone">
                {currentCardIndex < totalCards ? (
                  studyMode === 'flashcard' ? (
                    <FlashCard
                      key={cards[currentCardIndex].card._id}
                      cardItem={cards[currentCardIndex]}
                      mode="review"
                      onSuccess={handleCardSuccess}
                      onHide={handleRequestHide}
                      onCardStateChange={handleCardStateChange}
                    />
                  ) : (
                    <FlashCardQuiz
                      key={cards[currentCardIndex].card._id}
                      cardItem={cards[currentCardIndex]}
                      mode="review"
                      onSuccess={handleCardSuccess}
                      onHide={handleRequestHide}
                      onCardStateChange={handleCardStateChange}
                    />
                  )
                ) : (
                  // MÀN HÌNH HOÀN THÀNH ÔN TẬP
                  <div className="study-completion-screen">
                    <div className="completion-icon-wrapper">
                      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <h3 className="completion-title">{t('review.completedTitle')}</h3>
                    <p className="completion-subtitle">
                      {t('review.completedSubtitle')}
                    </p>
                    <button onClick={handleBackClick} className="btn-back-to-vocabulary">
                      {t('review.backToVocabulary')}
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            // MÀN HÌNH TRỐNG KHI KHÔNG CÓ THẺ NÀO ĐẾN HẠN
            <div className="no-due-review-screen">
              <div className="no-due-icon-wrapper">
                <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="no-due-title">{t('review.noDueCards')}</h3>
              <p className="no-due-subtitle">{t('review.noDueCardsSubtitle')}</p>
              <button onClick={handleBackClick} className="btn-back-to-vocabulary">
                {t('review.backToVocabulary')}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modal xác nhận ẩn thẻ */}
      <ConfirmModal
        isOpen={isConfirmHideOpen}
        title={t('review.confirmHideTitle')}
        message={t('review.confirmHideMessage')}
        confirmText={t('review.confirmHideConfirmText')}
        cancelText={t('review.confirmHideCancelText')}
        onConfirm={handleConfirmHide}
        onCancel={handleCancelHide}
        isDanger={true}
      />
    </div>
  )
}

export default ReviewPage
