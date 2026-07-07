import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getBattleMatchById } from '../battleApi'
import { useAuth } from '../../../context/AuthContext'

const MatchDetailModal = ({ isOpen, onClose, matchId }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMatchDetail = async () => {
      if (!matchId) return
      try {
        setLoading(true)
        setError(null)
        const response = await getBattleMatchById(matchId)
        if (response && response.success && response.data) {
          setMatch(response.data)
        } else {
          setError(t('api.error.NOT_FOUND'))
        }
      } catch (err) {
        console.error('Failed to load match detail', err)
        setError(err.response?.data?.message || t('api.common.UNKNOWN_ERROR'))
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && matchId) {
      fetchMatchDetail()
    } else {
      setMatch(null)
    }
  }, [isOpen, matchId, t])

  if (!isOpen) return null

  const getOpponent = (players) => {
    const myId = user?.id || user?._id
    // Tìm đối thủ có ID khác với bản thân
    const opponent = players.find(p => p.userId && p.userId._id !== myId)
    // Nếu tự chơi 1 mình trên 2 tab bằng 1 account, hoặc không tìm thấy, lấy đối tượng thứ 2 nếu có
    if (!opponent && players.length > 1) {
      return players[1]
    }
    return opponent
  }

  const getSelf = (players) => {
    const myId = user?.id || user?._id
    const self = players.find(p => p.userId && p.userId._id === myId)
    if (!self && players.length > 0) {
      return players[0]
    }
    return self
  }

  const formatModeText = (mode) => {
    return mode === 'mcq' ? t('battle.modeMcq') : t('battle.modeTyping')
  }

  const formatTypeText = (type) => {
    return type === 'queue' ? t('battle.typeQueue') : t('battle.typeInvite')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getOutcomeStatus = (player, winnerId) => {
    if (!winnerId) return 'draw'
    const pId = player?.userId?._id || player?.userId
    const wId = winnerId?._id || winnerId
    return pId?.toString() === wId?.toString() ? 'win' : 'lose'
  }

  const selfRecord = match ? getSelf(match.players) : null
  const oppRecord = match ? getOpponent(match.players) : null
  const selfOutcome = match && selfRecord ? getOutcomeStatus(selfRecord, match.winnerId) : 'draw'
  const oppOutcome = match && oppRecord ? getOutcomeStatus(oppRecord, match.winnerId) : 'draw'

  return (
    <div className="battle-modal-overlay" onClick={onClose}>
      <div 
        className="battle-modal-container battle-detail-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="battle-detail-modal-header">
          <h3 className="battle-modal-title">{t('battle.matchDetailTitle')}</h3>
          <button className="battle-detail-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="battle-detail-modal-body">
          {loading ? (
            <div className="battle-detail-loading-box">
              <div className="battle-spinner"></div>
            </div>
          ) : error ? (
            <div className="battle-detail-error-box">
              <p>{error}</p>
            </div>
          ) : match ? (
            <div className="battle-detail-content">
              {/* Thông tin chung */}
              <div className="battle-detail-general-info">
                <div className="battle-detail-info-item">
                  <span className="info-lbl">{t('battle.matchTime')}:</span>
                  <span className="info-val">{formatDate(match.finishedAt || match.updatedAt)}</span>
                </div>
                <div className="battle-detail-info-item">
                  <span className="info-lbl">{t('battle.mode')}:</span>
                  <span className="info-val">{formatModeText(match.mode)}</span>
                </div>
                <div className="battle-detail-info-item">
                  <span className="info-lbl">{t('battle.type')}:</span>
                  <span className="info-val">{formatTypeText(match.matchType)}</span>
                </div>
              </div>

              {/* Khu vực đối kháng */}
              <div className="battle-detail-vs-section">
                {/* Người chơi bản thân */}
                {selfRecord && (
                  <div className="battle-detail-player-card">
                    <div className={`player-avatar ${!selfRecord.userId?.avatarUrl ? 'avatar-placeholder' : ''}`}>
                      {selfRecord.userId?.avatarUrl ? (
                        <img src={selfRecord.userId.avatarUrl} alt={selfRecord.userId.name} />
                      ) : (
                        selfRecord.userId?.name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <span className="player-name">{selfRecord.userId?.name || t('battle.anonymous')}</span>
                    <span className={`player-badge-outcome battle-badge-${selfOutcome}`}>
                      {selfOutcome === 'win' ? t('battle.win') : selfOutcome === 'lose' ? t('battle.lose') : t('battle.draw')}
                    </span>
                    <div className="player-stats-summary">
                      <div className="summary-row">
                        <span className="lbl">{t('battle.score')}:</span>
                        <span className="val">{selfRecord.score}</span>
                      </div>
                      <div className="summary-row">
                        <span className="lbl">{t('battle.correctCount')}:</span>
                        <span className="val">{selfRecord.correctCount}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="battle-detail-vs-text">
                  <span>VS</span>
                </div>

                {/* Đối thủ */}
                {oppRecord ? (
                  <div className="battle-detail-player-card">
                    <div className={`player-avatar ${!oppRecord.userId?.avatarUrl ? 'avatar-placeholder' : ''}`}>
                      {oppRecord.userId?.avatarUrl ? (
                        <img src={oppRecord.userId.avatarUrl} alt={oppRecord.userId.name} />
                      ) : (
                        oppRecord.userId?.name?.[0]?.toUpperCase() || 'O'
                      )}
                    </div>
                    <span className="player-name">{oppRecord.userId?.name || t('battle.anonymous')}</span>
                    <span className={`player-badge-outcome battle-badge-${oppOutcome}`}>
                      {oppOutcome === 'win' ? t('battle.win') : oppOutcome === 'lose' ? t('battle.lose') : t('battle.draw')}
                    </span>
                    <div className="player-stats-summary">
                      <div className="summary-row">
                        <span className="lbl">{t('battle.score')}:</span>
                        <span className="val">{oppRecord.score}</span>
                      </div>
                      <div className="summary-row">
                        <span className="lbl">{t('battle.correctCount')}:</span>
                        <span className="val">{oppRecord.correctCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="battle-detail-player-card empty">
                    <div className="player-avatar avatar-placeholder">
                      ?
                    </div>
                    <span className="player-name">{t('battle.anonymous')}</span>
                    <span className="player-badge-outcome battle-badge-draw">{t('battle.draw')}</span>
                    <div className="player-stats-summary">
                      <div className="summary-row">
                        <span className="lbl">{t('battle.score')}:</span>
                        <span className="val">0</span>
                      </div>
                      <div className="summary-row">
                        <span className="lbl">{t('battle.correctCount')}:</span>
                        <span className="val">0</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Danh sách câu hỏi */}
              {match.questions && match.questions.length > 0 && (
                <div className="battle-detail-questions-section">
                  <h4 className="section-title">{t('battle.questionsList')}</h4>
                  <div className="questions-table">
                    <div className="questions-table-header">
                      <span className="col-idx">#</span>
                      <span className="col-q">{t('battle.question')}</span>
                      <span className="col-ans">{t('battle.correctAnswer')}</span>
                    </div>
                    <div className="questions-table-body">
                      {match.questions.map((q, idx) => (
                        <div key={idx} className="questions-table-row">
                          <span className="col-idx">{idx + 1}</span>
                          <span className="col-q">{q.term}</span>
                          <span className="col-ans">{q.correctAnswer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default MatchDetailModal
