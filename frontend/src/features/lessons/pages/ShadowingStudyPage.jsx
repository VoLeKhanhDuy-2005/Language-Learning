import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getLessonDetail, getLessonSegments, patchSegmentProgress } from '../lessonsApi'
import { getPresignedUrl, uploadAudioToS3 } from '../../../utils/s3Upload'
import { WAVRecorder } from '../utils/WAVRecorder'
import LessonYoutubePlayer from '../components/LessonYoutubePlayer'
import StudySegmentSidebar from '../components/StudySegmentSidebar'
import './ShadowingStudyPage.css'

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

function ShadowingStudyPage({ lessonId, onNavigate }) {
  const { t } = useTranslation()
  const [lesson, setLesson] = useState(null)
  const [segments, setSegments] = useState([])
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)

  // Trạng thái học tập của segment hiện tại
  const [attemptCount, setAttemptCount] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [accuracyScore, setAccuracyScore] = useState(null)
  const [wordsAccuracy, setWordsAccuracy] = useState(null)
  const [userAudioUrl, setUserAudioUrl] = useState(null)
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false)
  const audioRef = useRef(null)

  // Trạng thái chung
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Trình ghi âm và YouTube Player Refs
  const recorderRef = useRef(null)
  const playerRef = useRef(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

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

          // Tìm segment đầu tiên chưa hoàn thành (chưa có userProgress.shadowing)
          const firstIncompleteIdx = list.findIndex(
            (item) => !item.userProgress || !item.userProgress.shadowing
          )
          setCurrentSegmentIndex(firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0)
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu bài học:', err)
        setError(t('shadowing.errorLoad'))
      } finally {
        setLoading(false)
      }
    }

    if (lessonId) {
      loadData()
    }
  }, [lessonId, t])

  // Khởi tạo thực thể WAVRecorder
  useEffect(() => {
    recorderRef.current = new WAVRecorder()
    return () => {
      if (recorderRef.current && isRecording) {
        try {
          recorderRef.current.stop()
        } catch (e) {
          console.error(e)
        }
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Reset trạng thái segment khi chuyển đổi segment
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlayingUserAudio(false)
    }

    if (segments.length > 0 && segments[currentSegmentIndex]) {
      const currentProgress = segments[currentSegmentIndex].userProgress?.shadowing
      setAttemptCount(currentProgress ? currentProgress.attemptCount || 1 : 1)
      setAccuracyScore(
        currentProgress
          ? Math.round((v => v.reduce((sum, s) => sum + s, 0) / v.length)(Object.values(currentProgress.wordsAccuracy)))
          : null
      )
      setWordsAccuracy(currentProgress ? currentProgress.wordsAccuracy : null)
      setUserAudioUrl(currentProgress ? currentProgress.latestAudioUrl : null)
      setIsRecording(false)
      setIsProcessing(false)
    }
  }, [currentSegmentIndex, segments])

  const videoId = lesson ? getYouTubeVideoId(lesson.sourceUrl) : ''

  if (loading) {
    return (
      <div className="shadowing-loading-screen">
        <div className="shadowing-spinner"></div>
        <p>{t('shadowing.loading')}</p>
      </div>
    )
  }

  if (error || !lesson || segments.length === 0) {
    return (
      <div className="shadowing-error-screen">
        <p className="error-text">{error || t('shadowing.errorLoad')}</p>
        <button onClick={() => onNavigate && onNavigate('/lessons')} className="btn-back-list">
          {t('shadowing.backToList')}
        </button>
      </div>
    )
  }

  const currentSegmentData = segments[currentSegmentIndex]
  const segment = currentSegmentData?.segment
  const userProgress = currentSegmentData?.userProgress

  // Xử lý phát lại đoạn segment hiện tại
  const handleReplaySegment = () => {
    if (!segment) return
    setAttemptCount(prev => prev + 1)
    if (playerRef.current && typeof playerRef.current.replay === 'function') {
      playerRef.current.replay()
    }
  }

  // Xử lý phát/dừng audio ghi âm của người dùng
  const handlePlayUserAudio = () => {
    if (!userAudioUrl) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlayingUserAudio(false)
      return
    }

    const audio = new Audio(userAudioUrl)
    audioRef.current = audio
    setIsPlayingUserAudio(true)

    audio.play().catch(err => {
      console.error('Lỗi phát âm thanh người dùng:', err)
      setIsPlayingUserAudio(false)
      audioRef.current = null
    })

    audio.onended = () => {
      setIsPlayingUserAudio(false)
      audioRef.current = null
    }
  }

  // Xử lý bật/tắt ghi âm
  const handleToggleRecord = async () => {
    if (isProcessing) return

    if (!isRecording) {
      // Bắt đầu ghi âm
      try {
        setError('')
        await recorderRef.current.start()
        setIsRecording(true)
      } catch (err) {
        console.error('Lỗi khi truy cập micro:', err)
        setError(t('shadowing.micPermissionDenied'))
      }
    } else {
      // Dừng ghi âm và tải lên S3
      setIsRecording(false)
      setIsProcessing(true)
      setError('')
      try {
        const audioBlob = recorderRef.current.stop()

        // 1. Lấy URL ký trước từ Backend
        const presignedRes = await getPresignedUrl({
          contentType: 'audio/wav',
          purpose: 'shadowing-audio',
          fileSize: audioBlob.size
        })

        if (!presignedRes.success || !presignedRes.data?.uploadUrl) {
          throw new Error('Could not get presigned upload URL')
        }

        const { uploadUrl, url } = presignedRes.data

        // 2. Upload file ghi âm WAV trực tiếp lên S3
        await uploadAudioToS3(uploadUrl, audioBlob, 'audio/wav')

        // 3. Patch tiến độ cập nhật bài học lên server
        const payload = {
          shadowing: {
            attemptCount: attemptCount,
            latestAudioUrl: url
          }
        }

        const response = await patchSegmentProgress(lessonId, segment._id, payload)

        if (response.success) {
          const updatedProgress = response.data.progress || response.data
          // Cập nhật state segments
          setSegments((prevSegments) =>
            prevSegments.map((item, idx) => {
              if (idx === currentSegmentIndex) {
                return {
                  ...item,
                  userProgress: updatedProgress
                }
              }
              return item
            })
          )

          // Cập nhật điểm và độ chính xác phân tích phát âm
          const shadowingData = updatedProgress.shadowing
          if (shadowingData) {
            setAccuracyScore(Math.round((v => v.reduce((sum, s) => sum + s, 0) / v.length)(Object.values(shadowingData.wordsAccuracy))))
            setWordsAccuracy(shadowingData.wordsAccuracy)
            setUserAudioUrl(shadowingData.latestAudioUrl)
          }

          // Tăng attemptCount cho lần thu âm tiếp theo
          setAttemptCount(prev => prev + 1)
        } else {
          setError(response.message || t('shadowing.errorUpdateProgress'))
        }
      } catch (err) {
        console.error('Lỗi xử lý file ghi âm:', err)
        setError(t('shadowing.errorUpload'))
      } finally {
        setIsProcessing(false)
      }
    }
  }

  // Chuyển phân đoạn tiếp theo
  const handleNextSegment = () => {
    if (isSubmitting || !segment) return

    // Chuyển sang segment tiếp theo nếu chưa phải segment cuối cùng
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1)
    } else {
      setCurrentSegmentIndex(segments.length) // Render màn hình chúc mừng
    }
  }



  // Phân tích từ vựng để hiển thị màu sắc dựa trên wordsAccuracy
  const renderAnalysisWords = () => {
    if (!segment) return null
    const originalText = segment.transcript.original || ''
    const words = originalText.trim().split(/\s+/)

    return words.map((rawWord, idx) => {
      const cleanKey = rawWord.toLowerCase().replace(/[^a-z0-9]/g, '')
      const score = wordsAccuracy ? wordsAccuracy[cleanKey] : undefined

      let colorClass = 'word-accuracy-neutral'
      if (score !== undefined) {
        if (score > 80) {
          colorClass = 'word-accuracy-green'
        } else if (score >= 50) {
          colorClass = 'word-accuracy-yellow'
        } else {
          colorClass = 'word-accuracy-red'
        }
      }

      return (
        <span key={idx} className={colorClass}>
          {rawWord}{' '}
        </span>
      )
    })
  }

  // SVG Circle Stroke calculation
  const strokeDashoffset = accuracyScore !== null ? 283 - (283 * accuracyScore) / 100 : 283
  let strokeColor = 'var(--color-primary)'
  if (accuracyScore !== null) {
    if (accuracyScore < 50) strokeColor = 'var(--color-error)'
    else if (accuracyScore < 80) strokeColor = 'var(--color-warning)'
    else strokeColor = 'var(--color-success)'
  }
  const isFinished = !!(userProgress && userProgress.shadowing)

  return (
    <div className="shadowing-study-container">

      {/* GRID CHÍNH 3 CỘT */}
      <div className="shadowing-study-layout">

        {/* CỘT 1: MEDIA PLAYER (BÊN TRÁI) */}
        <LessonYoutubePlayer
          ref={playerRef}
          lesson={lesson}
          videoId={videoId}
          startMs={segment?.startMs || 0}
          endMs={segment?.endMs || 0}
          onPlayerReadyStateChange={setIsPlayerReady}
        />

        {/* CỘT 2: KHU VỰC HỌC SHADOWING (Ở GIỮA) */}
        <main className="shadowing-center-main">
          {currentSegmentIndex < segments.length ? (
            <div className="study-shadowing-wrapper">

              {/* Lời thoại của segment hiện tại */}
              <p className="study-transcript-display">
                {segment?.transcript?.original}
              </p>

              {/* Hàng điều khiển nút ghi âm */}
              <div className="recording-controls-row">

                {/* Nút phát lại */}
                <div className="control-btn-wrapper">
                  <button onClick={handleReplaySegment} className="btn-control-side" disabled={isRecording || isProcessing}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                  </button>
                  <span className="control-btn-label">{t('shadowing.replayBtn')}</span>
                </div>

                {/* Nút Ghi âm chính */}
                <div className="control-btn-wrapper">
                  <button
                    onClick={handleToggleRecord}
                    className={`btn-record-main ${isRecording ? 'recording' : ''}`}
                    disabled={isProcessing}
                  >
                    {isRecording ? (
                      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.2 6 6.72V21h2v-3.28c3.28-.48 6-3.26 6-6.72h-1.7z" />
                      </svg>
                    )}
                  </button>
                  <span className="control-btn-label">
                    {isRecording ? t('shadowing.recordStop') : t('shadowing.recordStart')}
                  </span>
                </div>

                {/* Nút Tiếp tục */}
                <div className="control-btn-wrapper">
                  <button
                    onClick={handleNextSegment}
                    className="btn-control-side"
                    disabled={isRecording || isProcessing || !isFinished}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>
                  <span className="control-btn-label">{t('shadowing.nextBtn')}</span>
                </div>

              </div>

              {/* Trạng thái ghi âm hoặc xử lý lỗi */}
              {(isRecording || isProcessing || error) && (
                <div className="shadowing-status-alert-box">
                  {isRecording && <span className="recording-text">{t('shadowing.recordingState')}</span>}
                  {isProcessing && <span className="processing-text">{t('shadowing.processing')}</span>}
                  {error && <span className="error-text">{error}</span>}
                </div>
              )}

            </div>
          ) : (
            // MÀN HÌNH HOÀN THÀNH TOÀN BỘ BÀI HỌC
            <div className="shadowing-completion-screen">
              <div className="completion-icon-box">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="completion-title">{t('shadowing.completedTitle')}</h3>
              <p className="completion-subtitle">{t('shadowing.completedSubtitle')}</p>
              <button onClick={() => onNavigate && onNavigate('/lessons')} className="btn-back-lessons-list">
                {t('shadowing.backToList')}
              </button>
            </div>
          )}

          {/* KHỐI KẾT QUẢ PHÂN TÍCH PHÁT ÂM (CHỈ HIỂN THỊ KHI CÓ ĐIỂM) */}
          {currentSegmentIndex < segments.length && accuracyScore !== null && (
            <div className="shadowing-results-row">

              {/* Thẻ Độ chính xác hình tròn */}
              <div className="accuracy-score-card">
                <span className="accuracy-card-label">{t('shadowing.accuracyLabel')}</span>
                <div className="radial-progress-container">
                  <svg className="radial-progress-svg" viewBox="0 0 100 100">
                    <circle className="radial-bg-circle" cx="50" cy="50" r="45" />
                    <circle
                      className="radial-fill-circle"
                      cx="50"
                      cy="50"
                      r="45"
                      style={{ strokeDashoffset, stroke: strokeColor }}
                    />
                  </svg>
                  <span className="radial-score-text">{accuracyScore}</span>
                </div>
                {userAudioUrl && (
                  <button onClick={handlePlayUserAudio} className="btn-play-user-audio">
                    {isPlayingUserAudio ? (
                      <>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                        <span>{t('shadowing.stopAudioBtn')}</span>
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>{t('shadowing.playAudioBtn')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Thẻ Phân tích Phát âm từng từ */}
              <div className="pronunciation-analysis-card">
                <h4 className="analysis-card-title">{t('shadowing.analysisTitle')}</h4>
                <div className="analysis-words-flow">
                  {renderAnalysisWords()}
                </div>
              </div>

            </div>
          )}
        </main>

        {/* CỘT 3: TIẾN ĐỘ & DANH SÁCH SEGMENT (BÊN PHẢI) */}
        <StudySegmentSidebar
          segments={segments}
          currentSegmentIndex={currentSegmentIndex}
          onSelectSegment={setCurrentSegmentIndex}
          mode="shadowing"
        />

      </div>
    </div>
  )
}

export default ShadowingStudyPage
