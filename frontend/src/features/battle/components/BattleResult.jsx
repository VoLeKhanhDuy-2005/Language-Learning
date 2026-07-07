import React from 'react'
import { useTranslation } from 'react-i18next'

const BattleResult = ({ user, opponent, scores, winnerId, players, matchType, onExit }) => {
  const { t } = useTranslation()

  const myId = user?.id || user?._id
  const opponentId = opponent?.id || opponent?._id

  const isWin = winnerId === myId
  const isLose = winnerId === opponentId
  const isDraw = winnerId === null

  const myStats = players.find(p => p.userId === myId) || { score: 0, correctCount: 0 }
  const oppStats = players.find(p => p.userId === opponentId) || { score: 0, correctCount: 0 }

  const myFinalScore = scores[myId] !== undefined ? scores[myId] : myStats.score
  const oppFinalScore = opponentId ? (scores[opponentId] !== undefined ? scores[opponentId] : oppStats.score) : 0

  // Tính toán phần thưởng XP hiển thị trên UI theo logic của server
  const isQueue = matchType === 'queue'
  const hitThreshold = myStats.correctCount >= 3 // minCorrectForReward = 3
  
  let earnedXp = 0
  let xpDetails = []

  if (isQueue) {
    if (hitThreshold) {
      earnedXp += 15 // battle_play
      xpDetails.push(`+15 XP ${t('battle.xpPlay')}`)
      if (isWin) {
        earnedXp += 35 // battle_win
        xpDetails.push(`+35 XP ${t('battle.xpWin')}`)
      }
    }
  }

  const getOutcomeText = () => {
    if (isWin) return t('battle.victory')
    if (isLose) return t('battle.defeat')
    return t('battle.draw')
  }

  const getOutcomeClass = () => {
    if (isWin) return 'win'
    if (isLose) return 'lose'
    return 'draw'
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="battle-result-container">
      <div className="battle-result-header">
        <h2 className={`battle-result-outcome ${getOutcomeClass()}`}>
          {getOutcomeText()}
        </h2>
        <p className="battle-lobby-subtitle">
          {isWin ? t('battle.victoryDesc') : isLose ? t('battle.defeatDesc') : t('battle.drawDesc')}
        </p>
      </div>

      {/* Bảng điểm chi tiết */}
      <div className="battle-result-scores-box">
        {/* Người chơi hiện tại */}
        <div className="battle-result-row">
          <div className="battle-result-player-info">
            <div className={`battle-result-player-avatar ${!user?.avatarUrl ? 'avatar-placeholder' : ''}`}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div>
              <span className="battle-result-player-name">{user?.name || t('battle.you')}</span>
              <div className="battle-lobby-subtitle" style={{ margin: 0, fontSize: '12px' }}>
                {t('battle.correctCount')}: {myStats.correctCount} / 10
              </div>
            </div>
          </div>
          <span className="battle-result-player-score">{myFinalScore} pts</span>
        </div>

        {/* Đối thủ */}
        {opponent && (
          <div className="battle-result-row">
            <div className="battle-result-player-info">
              <div className={`battle-result-player-avatar ${!opponent.avatarUrl ? 'avatar-placeholder' : ''}`}>
                {opponent.avatarUrl ? (
                  <img src={opponent.avatarUrl} alt={opponent.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  getInitials(opponent.name)
                )}
              </div>
              <div>
                <span className="battle-result-player-name">{opponent.name}</span>
                <div className="battle-lobby-subtitle" style={{ margin: 0, fontSize: '12px' }}>
                  {t('battle.correctCount')}: {oppStats.correctCount} / 10
                </div>
              </div>
            </div>
            <span className="battle-result-player-score">{oppFinalScore} pts</span>
          </div>
        )}
      </div>

      {/* Phần thưởng Gamification */}
      <div className="battle-result-rewards">
        <h4 className="battle-reward-title">{t('battle.rewardsTitle')}</h4>
        <div className="battle-reward-items">
          {/* Streak item */}
          <div className="battle-reward-item">
            <span className="battle-reward-val">1</span>
            <span className="battle-reward-lbl">{t('battle.streakMaintained')}</span>
          </div>

          {/* XP item */}
          <div className="battle-reward-item">
            <span className="battle-reward-val">+{earnedXp}</span>
            <span className="battle-reward-lbl">XP</span>
          </div>
        </div>

        {/* Thông tin giải thích */}
        <div className="battle-reward-note">
          {isQueue ? (
            hitThreshold ? (
              <span>{xpDetails.join(' & ')}</span>
            ) : (
              <span>{t('battle.xpThresholdHint')}</span>
            )
          ) : (
            <span>{t('battle.xpInviteHint')}</span>
          )}
        </div>
      </div>

      <div className="battle-result-actions">
        <button className="btn-battle-primary" onClick={onExit}>
          {t('battle.exit')}
        </button>
      </div>
    </div>
  )
}

export default BattleResult
