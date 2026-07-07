import React from 'react'
import { useTranslation } from 'react-i18next'

const DisconnectOverlay = ({ isOpen, secondsLeft }) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="battle-disconnect-overlay">
      <h3 className="battle-disconnect-title">{t('battle.opponentDisconnected')}</h3>
      <p className="battle-lobby-subtitle" style={{ color: 'var(--color-on-surface)' }}>
        {t('battle.waitingForReconnect')}
      </p>
      <div className="battle-disconnect-timer">
        {secondsLeft}
      </div>
      <div className="battle-spinner" style={{ width: '48px', height: '48px', borderWidth: '5px' }}></div>
    </div>
  )
}

export default DisconnectOverlay
