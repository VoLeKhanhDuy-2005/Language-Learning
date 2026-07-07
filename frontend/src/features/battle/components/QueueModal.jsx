import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const QueueModal = ({ isOpen, mode, onCancel }) => {
  const { t } = useTranslation()
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setSeconds(0)
      return
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  if (!isOpen) return null

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="battle-modal-overlay">
      <div className="battle-modal-container">
        <h3 className="battle-modal-title">{t('battle.searchingMatch')}</h3>
        <p className="battle-lobby-subtitle">
          {mode === 'mcq' ? t('battle.modeMcq') : t('battle.modeTyping')}
        </p>
        <div className="battle-spinner"></div>
        <div className="battle-pregame-number" style={{ fontSize: '24px' }}>
          {formatTime(seconds)}
        </div>
        <button className="btn-battle-primary" onClick={onCancel}>
          {t('battle.cancelSearch')}
        </button>
      </div>
    </div>
  )
}

export default QueueModal
