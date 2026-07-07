import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getLessonDetail, getLessonSegments, patchSegmentProgress } from '../lessonsApi'
import LessonYoutubePlayer from '../components/LessonYoutubePlayer'
import StudySegmentSidebar from '../components/StudySegmentSidebar'
import './DictationStudyPage.css'

// Hàm trích xuất ID video YouTube
const getYouTubeVideoId = (url) => {
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

    return videoId
  } catch {
    return ''
  }
}

function DictationStudyPage({ lessonId, onNavigate }) {
  const { t } = useTranslation()
  const [lesson, setLesson] = useState(null)
  const [segments, setSegments] = useState([])
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)

  // Trạng thái học tập của segment hiện tại
  const [userInput, setUserInput] = useState('')
  const [revealedIndices, setRevealedIndices] = useState(new Set())
  const [attemptCount, setAttemptCount] = useState(1)

  // YouTube Player Refs & State
  const playerRef = useRef(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  // Trạng thái chung
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const textareaRef = useRef(null)

  // 1. Tải thông tin bài học và danh sách segments
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const [lessonRes, segmentsRes] = await Promise.all([
          getLessonDetail(lessonId),
          getLessonSegments(lessonId)
        ])

        if (lessonRes.success) {
          setLesson(lessonRes.data.lesson)
        }

        if (segmentsRes.success && Array.isArray(segmentsRes.data)) {
          const list = segmentsRes.data
          setSegments(list)

          // Tìm segment đầu tiên chưa hoàn thành (userProgress là null hoặc không có tiến độ dictation)
          const firstIncompleteIdx = list.findIndex(
            (item) => !item.userProgress || !item.userProgress.dictation
          )
          setCurrentSegmentIndex(firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0)
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu bài học:', err)
        setError(t('dictation.errorLoad'))
      } finally {
        setLoading(false)
      }
    }

    if (lessonId) {
      loadData()
    }
  }, [lessonId, t])

  // Reset trạng thái segment khi chuyển đổi segment
  useEffect(() => {
    if (segments.length > 0 && segments[currentSegmentIndex]) {
      setUserInput('')
      setRevealedIndices(new Set())
      setAttemptCount(1)
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }, [currentSegmentIndex, segments])

  const videoId = lesson ? getYouTubeVideoId(lesson.sourceUrl) : ''

  if (loading) {
    return (
      <div className="dictation-loading-screen">
        <div className="dictation-spinner"></div>
        <p>{t('dictation.loading')}</p>
      </div>
    )
  }

  if (error || !lesson || segments.length === 0) {
    return (
      <div className="dictation-error-screen">
        <p className="error-text">{error || t('dictation.errorLoad')}</p>
        <button onClick={() => onNavigate && onNavigate('/lessons')} className="btn-back-list">
          {t('dictation.backToList')}
        </button>
      </div>
    )
  }

  const currentSegmentData = segments[currentSegmentIndex]
  const segment = currentSegmentData?.segment
  const userProgress = currentSegmentData?.userProgress

  // Tách các từ gốc trong normalized transcript để so khớp
  const normalizedText = segment?.transcript?.normalized || ''
  const refWords = normalizedText.trim().split(/\s+/).filter(Boolean)
  const cleanRefWords = refWords.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))

  // Tách các từ người dùng đã nhập
  const userWords = userInput.trim().split(/\s+/).filter(Boolean)

  // Hàm so khớp từ theo từng ký tự
  const getWordMatchStatus = (index) => {
    const refWord = refWords[index]
    const cleanRef = cleanRefWords[index]

    // Nếu từ đã được tiết lộ bằng con mắt
    if (revealedIndices.has(index)) {
      return {
        displayText: refWord,
        status: 'revealed' // Đã tiết lộ
      }
    }

    const userWord = userWords[index] || ''
    const cleanUser = userWord.toLowerCase().replace(/[^a-z0-9]/g, '')

    if (cleanUser.length === 0) {
      // Chưa gõ -> Toàn dấu sao
      return {
        displayText: '*'.repeat(cleanRef.length),
        status: 'empty'
      }
    }

    // So khớp từng ký tự để hiển thị
    let matchedLength = 0
    for (let j = 0; j < cleanRef.length; j++) {
      if (j < cleanUser.length && cleanUser[j] === cleanRef[j]) {
        matchedLength++
      } else {
        break
      }
    }

    // Nếu khớp hoàn toàn
    if (cleanUser === cleanRef) {
      return {
        displayText: refWord,
        status: 'correct'
      }
    }

    // Đang gõ dở hoặc sai
    const visiblePart = cleanRef.slice(0, matchedLength)
    const starredPart = '*'.repeat(cleanRef.length - matchedLength)
    return {
      displayText: visiblePart + starredPart,
      status: 'incorrect'
    }
  }

  // Phân tích trạng thái của tất cả các từ trong segment hiện tại
  const parsedWords = refWords.map((_, idx) => getWordMatchStatus(idx))

  // Kiểm tra xem segment đã hoàn thành hoàn toàn chưa (tất cả các từ đều correct hoặc revealed)
  const isSegmentCompleted = parsedWords.every(w => w.status === 'correct' || w.status === 'revealed')

  // Xử lý tiết lộ một từ
  const handleRevealWord = (index) => {
    setRevealedIndices((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }

  // Xử lý hiện tất cả các từ
  const handleShowAllWords = () => {
    const allIndices = new Set(refWords.map((_, idx) => idx))
    setRevealedIndices(allIndices)
  }

  // Phát lại phân đoạn hiện tại
  const handleReplaySegment = () => {
    if (playerRef.current && typeof playerRef.current.replay === 'function') {
      playerRef.current.replay()
    }
  }

  // Xử lý gửi tiến độ học khi hoàn thành segment
  const handleNextSegment = async () => {
    if (isSubmitting || !segment) return

    setIsSubmitting(true)
    try {
      const payload = {
        dictation: {
          attemptCount: attemptCount,
          hintUsedCount: revealedIndices.size
        }
      }

      const response = await patchSegmentProgress(lessonId, segment._id, payload)

      if (response.success) {
        // Cập nhật lại danh sách segments kèm tiến độ mới để hiển thị đồng bộ ở cột phải
        setSegments((prevSegments) =>
          prevSegments.map((item, idx) => {
            if (idx === currentSegmentIndex) {
              return {
                ...item,
                userProgress: response.data.progress || response.data
              }
            }
            return item
          })
        )

        // Chuyển sang segment tiếp theo nếu chưa phải segment cuối cùng
        if (currentSegmentIndex < segments.length - 1) {
          setCurrentSegmentIndex(prev => prev + 1)
        } else {
          // Nếu đã hoàn thành segment cuối cùng, hiển thị thông báo hoàn thành
          setCurrentSegmentIndex(segments.length) // Đẩy chỉ số vượt ngoài mảng để render màn hình chúc mừng
        }
      } else {
        setError(response.message || t('api.common.UNKNOWN_ERROR'))
      }
    } catch (err) {
      console.error('Lỗi khi nộp tiến độ segment:', err)
      setError(t('api.common.UNKNOWN_ERROR'))
    } finally {
      setIsSubmitting(false)
    }
  }



  return (
    <div className="dictation-study-container">

      {/* GRID CHÍNH 3 CỘT */}
      <div className="dictation-study-layout">

        {/* CỘT 1: MEDIA PLAYER (BÊN TRÁI) */}
        <div className="dictation-left-aside">
          <LessonYoutubePlayer
            ref={playerRef}
            lesson={lesson}
            videoId={videoId}
            startMs={segments[currentSegmentIndex]?.segment?.startMs || 0}
            endMs={segments[currentSegmentIndex]?.segment?.endMs || 0}
            onPlayerReadyStateChange={setIsPlayerReady}
          />
          {/* Nút Nghe lại đoạn này */}
          <div className="media-action-buttons">
            <button onClick={handleReplaySegment} className="btn-replay-segment">
              {t('dictation.replayBtn')}
            </button>
          </div>
        </div>

        {/* CỘT 2: KHU VỰC HỌC CHÉP CHÍNH TẢ (Ở GIỮA) */}
        <main className="dictation-center-main">
          {currentSegmentIndex < segments.length ? (
            <div className="study-dictation-wrapper">

              <div className="study-card-header">
                <h3 className="study-card-title">{t('dictation.typeWhatYouHear')}</h3>
              </div>

              {/* Ô nhập liệu chép chính tả */}
              <div className="study-input-container">
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={t('dictation.placeholderInput')}
                  className="dictation-textarea"
                  rows={6}
                  disabled={isSegmentCompleted}
                />
              </div>

              {/* So khớp từ vựng theo ký tự */}
              <div className="words-match-feedback-section">
                <div className="feedback-section-title">{t('dictation.vocabularyHint')}</div>
                <div className="words-flex-grid">
                  {parsedWords.map((wordObj, idx) => {
                    let cardClass = 'word-status-empty'
                    if (wordObj.status === 'correct') cardClass = 'word-status-correct'
                    else if (wordObj.status === 'incorrect') cardClass = 'word-status-incorrect'
                    else if (wordObj.status === 'revealed') cardClass = 'word-status-revealed'

                    return (
                      <div key={idx} className="word-feedback-wrapper">
                        {wordObj.status !== 'correct' && wordObj.status !== 'revealed' && (
                          <button
                            type="button"
                            className="reveal-eye-btn"
                            onClick={() => handleRevealWord(idx)}
                            title="Reveal this word"
                          >
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        )}
                        {wordObj.status === 'revealed' && <div className="reveal-eye-placeholder"></div>}
                        <div className={`word-card-pill ${cardClass}`}>
                          {wordObj.displayText}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Cảnh báo sử dụng gợi ý */}
              {revealedIndices.size > 0 && (
                <div className="hint-alert-box">
                  <svg className="hint-alert-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{t('dictation.hintWarning')}</span>
                </div>
              )}

              {/* Hàng nút thao tác ở dưới */}
              <div className="study-actions-row">
                <button
                  type="button"
                  onClick={handleShowAllWords}
                  className="btn-outline-showall"
                  disabled={isSegmentCompleted}
                >
                  {t('dictation.showAllBtn')}
                </button>

                <button
                  type="button"
                  onClick={handleNextSegment}
                  className={`btn-primary-next ${isSegmentCompleted ? 'active' : ''}`}
                  disabled={!isSegmentCompleted || isSubmitting}
                >
                  <span>{t('dictation.nextBtn')}</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>

            </div>
          ) : (
            // MÀN HÌNH HOÀN THÀNH TOÀN BỘ BÀI HỌC
            <div className="dictation-completion-screen">
              <div className="completion-icon-box">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="completion-title">{t('dictation.completedTitle')}</h3>
              <p className="completion-subtitle">{t('dictation.completedSubtitle')}</p>
              <button onClick={() => onNavigate && onNavigate('/lessons')} className="btn-back-lessons-list">
                {t('dictation.backToList')}
              </button>
            </div>
          )}
        </main>

        {/* CỘT 3: TIẾN ĐỘ & DANH SÁCH SEGMENT (BÊN PHẢI) */}
        <StudySegmentSidebar
          segments={segments}
          currentSegmentIndex={currentSegmentIndex}
          onSelectSegment={setCurrentSegmentIndex}
          mode="dictation"
        />

      </div>
    </div>
  )
}

export default DictationStudyPage
