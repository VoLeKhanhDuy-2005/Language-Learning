import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useBattleSocket } from '../context/BattleSocketContext'
import { useAuth } from '../../../context/AuthContext'
import { getBattleMatchById } from '../battleApi'
import ScoreBoard from '../components/ScoreBoard'
import QuestionArea from '../components/QuestionArea'
import DisconnectOverlay from '../components/DisconnectOverlay'
import BattleResult from '../components/BattleResult'
import '../battle.css'

const BattlePlayPage = ({ onNavigate }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const {
    gameStatus,
    matchId,
    mode,
    currentRound,
    totalRounds,
    question,
    roundResult,
    scores,
    players,
    winnerId,
    isOpponentDisconnected,
    opponentDisconnectTimeLeft,
    sendAnswer,
    rejoinMatch,
    exitBattle
  } = useBattleSocket()

  const [opponent, setOpponent] = useState(null)
  const [matchType, setMatchType] = useState('queue')
  const [preGameCountdown, setPreGameCountdown] = useState(3)

  // Tự động rejoin nếu tải lại trang (F5) khi đang chơi
  useEffect(() => {
    const savedMatchId = sessionStorage.getItem('currentMatchId')
    if (savedMatchId && gameStatus === 'idle') {
      rejoinMatch(savedMatchId)
    }
  }, [gameStatus, rejoinMatch])

  // Kiểm tra nếu không có trận đấu đang diễn ra thì chuyển hướng người dùng về /battle
  useEffect(() => {
    const savedMatchId = sessionStorage.getItem('currentMatchId')
    if (gameStatus === 'idle' && !savedMatchId) {
      onNavigate('/battle')
    }
  }, [gameStatus, onNavigate])

  // Tải chi tiết trận đấu từ REST API để lấy thông tin đối thủ (tên, avatar)
  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!matchId) return
      try {
        const response = await getBattleMatchById(matchId)
        // Hỗ trợ cả trường hợp response là { success, data } hoặc trực tiếp match object
        const matchData = response?.data && response?.success !== undefined ? response.data : response
        
        if (matchData && matchData.players) {
          if (matchData.matchType) {
            setMatchType(matchData.matchType)
          }
          const myId = (user?.id || user?._id || '').toString()
          
          // Tìm đối thủ có ID khác mình
          let opponentPlayer = matchData.players.find(p => {
            const pUserId = p.userId?._id || p.userId?.id || p.userId
            return pUserId && pUserId.toString() !== myId
          })
          
          // Trường hợp tự đấu với chính mình bằng cùng tài khoản
          if (!opponentPlayer && matchData.players.length > 1) {
            // Nếu cả hai player trùng ID, ta lấy player ở vị trí đối lập
            const myIndex = matchData.players.findIndex(p => {
              const pUserId = p.userId?._id || p.userId?.id || p.userId
              return pUserId && pUserId.toString() === myId
            })
            const oppIndex = myIndex === 0 ? 1 : 0
            opponentPlayer = matchData.players[oppIndex]
          }
          
          if (opponentPlayer && opponentPlayer.userId) {
            const isObject = typeof opponentPlayer.userId === 'object'
            setOpponent({
              id: isObject ? (opponentPlayer.userId._id || opponentPlayer.userId.id) : opponentPlayer.userId,
              name: isObject ? opponentPlayer.userId.name : t('battle.anonymous'),
              avatarUrl: isObject ? opponentPlayer.userId.avatarUrl : null
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch match details', error)
      }
    }

    fetchMatchDetails()
  }, [matchId, user])

  // Đếm ngược 3 giây pre-game khi bắt đầu trận đấu
  useEffect(() => {
    if (gameStatus !== 'starting') return

    setPreGameCountdown(3)
    const countdownInterval = setInterval(() => {
      setPreGameCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [gameStatus])

  // Xử lý nộp câu trả lời lên server
  const handleAnswerSubmit = (index, answer) => {
    sendAnswer(index, answer)
  }

  // Rời trận đấu và quay về sảnh
  const handleExitMatch = () => {
    exitBattle()
    onNavigate('/battle')
  }

  // Nếu trận đấu bị huỷ (abandoned)
  useEffect(() => {
    if (gameStatus === 'abandoned') {
      const timer = setTimeout(() => {
        onNavigate('/battle')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameStatus])

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  // Render các trạng thái của game
  if (gameStatus === 'starting' && preGameCountdown > 0) {
    return (
      <div className="battle-play-layout">
        <div className="battle-pregame-countdown">
          <div className="battle-pregame-vs">
            {/* Me */}
            <div className="battle-vs-player">
              <div className={`battle-vs-avatar ${!user?.avatarUrl ? 'avatar-placeholder' : ''}`}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
              <span className="battle-vs-name">{user?.name || t('battle.you')}</span>
            </div>

            <div className="battle-vs-divider">VS</div>

            {/* Opponent */}
            <div className="battle-vs-player">
              <div className={`battle-vs-avatar ${!opponent?.avatarUrl ? 'avatar-placeholder' : ''}`}>
                {opponent?.avatarUrl ? (
                  <img src={opponent.avatarUrl} alt={opponent.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  opponent ? getInitials(opponent.name) : '?'
                )}
              </div>
              <span className="battle-vs-name">{opponent?.name || t('battle.waiting')}</span>
            </div>
          </div>
          
          <div className="battle-pregame-number">
            {preGameCountdown}
          </div>
          <p className="battle-lobby-subtitle">{t('battle.prepareToFight')}</p>
        </div>
      </div>
    )
  }

  if (gameStatus === 'finished') {
    return (
      <div className="battle-play-layout">
        <BattleResult
          user={user}
          opponent={opponent}
          scores={scores}
          winnerId={winnerId}
          players={players}
          matchType={matchType}
          onExit={handleExitMatch}
        />
      </div>
    )
  }

  if (gameStatus === 'abandoned') {
    return (
      <div className="battle-play-layout">
        <div className="battle-pregame-countdown">
          <h2 className="battle-result-outcome lose" style={{ fontSize: '32px' }}>
            {t('battle.matchAbandoned')}
          </h2>
          <p className="battle-lobby-subtitle">{t('battle.redirectingToLobby')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="battle-play-layout">
      {/* Lớp phủ mất kết nối */}
      <DisconnectOverlay
        isOpen={isOpponentDisconnected}
        secondsLeft={opponentDisconnectTimeLeft}
      />

      {/* Bảng điểm */}
      <ScoreBoard
        user={user}
        opponent={opponent}
        scores={scores}
        currentRound={currentRound}
        totalRounds={totalRounds}
        isOpponentDisconnected={isOpponentDisconnected}
      />

      {/* Khu vực câu hỏi */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        {question && (
          <QuestionArea
            question={question}
            mode={mode}
            roundResult={roundResult}
            onSubmitAnswer={handleAnswerSubmit}
            currentIndex={currentRound}
          />
        )}
      </div>
    </div>
  )
}

export default BattlePlayPage
