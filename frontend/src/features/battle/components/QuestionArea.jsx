import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const QuestionArea = ({ question, mode, roundResult, onSubmitAnswer, currentIndex }) => {
  const { t } = useTranslation()
  const [selectedOption, setSelectedOption] = useState(null)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [timeLeftPercent, setTimeLeftPercent] = useState(100)
  const [shake, setShake] = useState(false)

  const timerRef = useRef(null)
  const autoSubmitRef = useRef(false)

  // Reset state cho mỗi câu hỏi mới
  useEffect(() => {
    setSelectedOption(null)
    setTypedAnswer('')
    setHasSubmitted(false)
    setTimeLeftPercent(100)
    setShake(false)
    autoSubmitRef.current = false

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (!question || roundResult) return

    const deadline = question.deadlineTs
    const totalDuration = 12000 // 12 seconds

    timerRef.current = setInterval(() => {
      const now = Date.now()
      const remain = deadline - now
      
      if (remain <= 0) {
        clearInterval(timerRef.current)
        setTimeLeftPercent(0)
        // Hết giờ tự động nộp bài nếu chưa nộp
        if (!autoSubmitRef.current && !hasSubmitted) {
          autoSubmitRef.current = true
          setHasSubmitted(true)
          onSubmitAnswer(currentIndex, mode === 'mcq' ? '' : '')
        }
      } else {
        const percent = Math.min(100, Math.max(0, (remain / totalDuration) * 100))
        setTimeLeftPercent(percent)
      }
    }, 50)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [question, roundResult, currentIndex, mode])

  // Lắng nghe kết quả round để hiển thị trạng thái đúng/sai
  useEffect(() => {
    if (roundResult) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setTimeLeftPercent(0)

      // Nếu gõ sai ở Typing mode thì chạy hiệu ứng shake
      if (mode === 'typing' && hasSubmitted) {
        const isCorrect = typedAnswer.toLowerCase().trim() === roundResult.correctAnswer.toLowerCase().trim()
        if (!isCorrect) {
          setShake(true)
        }
      }
    }
  }, [roundResult, mode])

  if (!question) return null

  const handleMcqSelect = (option) => {
    if (hasSubmitted || roundResult) return
    setSelectedOption(option)
    setHasSubmitted(true)
    onSubmitAnswer(currentIndex, option)
  }

  const handleTypingSubmit = (e) => {
    e.preventDefault()
    if (hasSubmitted || roundResult || !typedAnswer.trim()) return
    setHasSubmitted(true)
    onSubmitAnswer(currentIndex, typedAnswer)
  }

  // Lớp CSS cho các tuỳ chọn MCQ
  const getMcqClass = (option) => {
    if (roundResult) {
      const isCorrect = option === roundResult.correctAnswer
      const isSelected = option === selectedOption
      if (isCorrect) return 'correct'
      if (isSelected && !isCorrect) return 'incorrect'
      return ''
    }
    if (option === selectedOption) return 'selected'
    return ''
  }

  // Lớp CSS cho ô gõ đáp án
  const getTypingInputClass = () => {
    if (roundResult) {
      const isCorrect = typedAnswer.toLowerCase().trim() === roundResult.correctAnswer.toLowerCase().trim()
      if (isCorrect) return 'correct'
      return `incorrect ${shake ? 'shake' : ''}`
    }
    return ''
  }

  return (
    <div style={{ width: '100%' }}>
      <div className="battle-question-card">
        {/* Câu hỏi */}
        <span className="battle-question-term">
          {question.term}
        </span>

        {/* Gợi ý cho Typing mode */}
        {mode === 'typing' && (
          <div className="battle-question-hint">
            {t('battle.hint')}: {question.firstChar}... ({question.answerLength} {t('battle.letters')}) 
            {question.answerPattern && question.answerPattern.length > 1 && (
              <span> - {t('battle.pattern')}: {question.answerPattern.join(', ')}</span>
            )}
          </div>
        )}

        {/* Thông báo trạng thái khi đang chờ hoặc tiết lộ đáp án */}
        {hasSubmitted && !roundResult && (
          <p className="battle-lobby-subtitle" style={{ color: 'var(--color-primary)' }}>
            {t('battle.waitingForOpponentShort')}
          </p>
        )}

        {roundResult && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <p className="battle-lobby-subtitle" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
              {t('battle.correctAnswer')}: {roundResult.correctAnswer}
            </p>
          </div>
        )}
      </div>

      {/* Thanh thời gian */}
      {!roundResult && (
        <div className="battle-timer-container">
          <div 
            className={`battle-timer-bar ${timeLeftPercent < 30 ? 'warning' : ''}`}
            style={{ width: `${timeLeftPercent}%` }}
          />
        </div>
      )}

      {/* Khu vực trả lời */}
      <div style={{ marginTop: '24px' }}>
        {mode === 'mcq' ? (
          <div className="battle-options-grid">
            {question.options && question.options.map((option, idx) => (
              <button
                key={idx}
                className={`battle-option-button ${getMcqClass(option)}`}
                onClick={() => handleMcqSelect(option)}
                disabled={hasSubmitted || roundResult}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="battle-typing-container">
            <form onSubmit={handleTypingSubmit} className="battle-typing-input-wrapper">
              <input
                type="text"
                className={`battle-typing-input ${getTypingInputClass()}`}
                placeholder={t('battle.typeHere')}
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                disabled={hasSubmitted || roundResult}
                autoFocus
              />
              <button 
                type="submit" 
                className="btn-battle-primary" 
                style={{ flex: 'none', padding: '0 24px', width: 'auto' }}
                disabled={hasSubmitted || roundResult || !typedAnswer.trim()}
              >
                {t('battle.submit')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionArea
