import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const RoomModal = ({ isOpen, code, onLeave }) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="battle-modal-overlay">
      <div className="battle-modal-container">
        <h3 className="battle-modal-title">{t('battle.roomCreated')}</h3>
        <p className="battle-lobby-subtitle">{t('battle.shareRoomCode')}</p>
        
        <div className="battle-modal-code-box" onClick={handleCopy}>
          {code}
        </div>
        
        <span style={{ fontSize: '13px', color: 'var(--color-on-surface-variant)', cursor: 'pointer' }} onClick={handleCopy}>
          {copied ? t('battle.copied') : t('battle.clickToCopy')}
        </span>

        <div className="battle-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
        <p className="battle-lobby-subtitle" style={{ fontSize: '14px' }}>
          {t('battle.waitingForOpponent')}
        </p>

        <button className="btn-battle-primary" onClick={onLeave}>
          {t('battle.leaveRoom')}
        </button>
      </div>
    </div>
  )
}

export default RoomModal
