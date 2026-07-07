import React from 'react'
import { useTranslation } from 'react-i18next'

const ScoreBoard = ({ user, opponent, scores, currentRound, totalRounds, isOpponentDisconnected }) => {
  const { t } = useTranslation()

  const myScore = scores[user?.id || user?._id] || 0
  const oppScore = opponent ? (scores[opponent.id || opponent._id] || 0) : 0

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="battle-scoreboard-card">
      {/* Player 1 (Me) */}
      <div className="battle-score-player">
        <div className={`battle-score-avatar ${!user?.avatarUrl ? 'avatar-placeholder' : ''}`}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            getInitials(user?.name)
          )}
        </div>
        <div className="battle-score-info">
          <span className="battle-score-name">{user?.name || t('battle.you')}</span>
          <span className="battle-score-pts">{myScore} pts</span>
        </div>
      </div>

      {/* Round info */}
      <div className="battle-score-middle">
        <span className="battle-round-badge">
          {t('battle.round')} {currentRound + 1} / {totalRounds}
        </span>
      </div>

      {/* Player 2 (Opponent) */}
      <div className={`battle-score-player right ${isOpponentDisconnected ? 'disconnected' : ''}`}>
        <div className={`battle-score-avatar ${!opponent?.avatarUrl ? 'avatar-placeholder' : ''}`}>
          {opponent?.avatarUrl ? (
            <img src={opponent.avatarUrl} alt={opponent.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            opponent ? getInitials(opponent.name) : '?'
          )}
        </div>
        <div className="battle-score-info">
          <span className="battle-score-name">
            {opponent?.name || t('battle.waitingForOpponent')}
            {isOpponentDisconnected && <span style={{ fontSize: '11px', color: 'var(--color-error)', display: 'block' }}>({t('battle.offline')})</span>}
          </span>
          <span className="battle-score-pts">{oppScore} pts</span>
        </div>
      </div>
    </div>
  )
}

export default ScoreBoard
