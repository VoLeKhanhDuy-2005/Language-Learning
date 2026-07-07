import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../../../context/AuthContext'
import i18n from '../../../i18n'

const BattleSocketContext = createContext(null)

export const useBattleSocket = () => {
  const context = useContext(BattleSocketContext)
  if (!context) {
    throw new Error('useBattleSocket must be used within a BattleSocketProvider')
  }
  return context
}

export const BattleSocketProvider = ({ children }) => {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // Game States
  const [gameStatus, setGameStatus] = useState('idle') // idle, searching, room_waiting, starting, playing, round_result, finished, abandoned
  const [roomCode, setRoomCode] = useState('')
  const [matchId, setMatchId] = useState('')
  const [mode, setMode] = useState('mcq')
  const [currentRound, setCurrentRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(10)
  const [question, setQuestion] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [scores, setScores] = useState({})
  const [players, setPlayers] = useState([])
  const [winnerId, setWinnerId] = useState(null)
  const [error, setError] = useState(null)
  
  // Disconnect & Reconnect States
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false)
  const [opponentDisconnectTimeLeft, setOpponentDisconnectTimeLeft] = useState(15)

  const disconnectTimerRef = useRef(null)

  // Khởi tạo/Ngắt kết nối Socket dựa trên user đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!user || !token) {
      if (socket) {
        socket.disconnect()
      }
      setSocket(null)
      setIsConnected(false)
      resetGameState()
      return
    }

    const socketUrl = import.meta.env.API_URL 
      ? import.meta.env.API_URL.replace('/api/v1', '') 
      : 'http://localhost:5000'

    const socketInstance = io(socketUrl, {
      auth: { token },
      autoConnect: false,
    })

    socketInstance.connect()

    socketInstance.on('connect', () => {
      setIsConnected(true)
      socketInstance.emit('battle:active_match:check')
    })

    socketInstance.on('battle:active_match:found', ({ matchId: activeMatchId }) => {
      if (activeMatchId) {
        sessionStorage.setItem('currentMatchId', activeMatchId)
        setMatchId(activeMatchId)
        socketInstance.emit('battle:rejoin', { matchId: activeMatchId })
      }
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    // Lắng nghe các sự kiện game
    socketInstance.on('battle:queue:timeout', () => {
      resetGameState()
      setError(i18n.t('battle.queueTimeout'))
    })

    socketInstance.on('battle:error', ({ code }) => {
      let msg = i18n.t('battle.errUnknown')
      if (code === 'ROOM_NOT_FOUND') {
        msg = i18n.t('battle.errRoomNotFound')
      } else if (code === 'INVALID_MODE') {
        msg = i18n.t('battle.errInvalidMode')
      } else if (code === 'OPPONENT_UNAVAILABLE') {
        msg = i18n.t('battle.errOpponentUnavailable')
      } else if (code === 'MATCH_START_FAILED') {
        msg = i18n.t('battle.errMatchStartFailed')
      } else if (code === 'MATCH_NOT_FOUND') {
        msg = i18n.t('battle.errMatchNotFound')
      }
      setError(msg)
    })

    socketInstance.on('battle:room:created', ({ code }) => {
      setRoomCode(code)
      setGameStatus('room_waiting')
    })

    socketInstance.on('battle:starting', ({ countdownMs, mode: matchMode, total, matchId: serverMatchId }) => {
      resetGameState()
      setMode(matchMode)
      setTotalRounds(total)
      const currentMatchId = serverMatchId || ''
      setMatchId(currentMatchId)
      if (currentMatchId) {
        sessionStorage.setItem('currentMatchId', currentMatchId)
      }
      setGameStatus('starting')
    })

    socketInstance.on('battle:question', ({ index, total, term, mode: matchMode, options, deadlineTs, answerLength, answerPattern, firstChar }) => {
      setGameStatus('playing')
      setCurrentRound(index)
      setTotalRounds(total)
      setQuestion({
        term,
        options,
        deadlineTs,
        answerLength,
        answerPattern,
        firstChar
      })
      setRoundResult(null)
    })

    socketInstance.on('battle:roundResult', ({ index, correctAnswer, scores: roundScores }) => {
      setGameStatus('round_result')
      setRoundResult({ index, correctAnswer })
      setScores(roundScores)
    })

    socketInstance.on('battle:finished', ({ scores: finalScores, winnerId: matchWinnerId, players: finalPlayers }) => {
      setGameStatus('finished')
      setScores(finalScores)
      setWinnerId(matchWinnerId)
      setPlayers(finalPlayers)
      setIsOpponentDisconnected(false)
      clearDisconnectTimer()
      sessionStorage.removeItem('currentMatchId')
    })

    socketInstance.on('battle:opponentDisconnected', ({ userId }) => {
      setIsOpponentDisconnected(true)
      setOpponentDisconnectTimeLeft(15)
      
      clearDisconnectTimer()
      disconnectTimerRef.current = setInterval(() => {
        setOpponentDisconnectTimeLeft((prev) => {
          if (prev <= 1) {
            clearDisconnectTimer()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    })

    socketInstance.on('battle:opponentReconnected', ({ userId }) => {
      setIsOpponentDisconnected(false)
      clearDisconnectTimer()
    })

    socketInstance.on('battle:opponentLeft', ({ winnerId: forfeitWinnerId, scores: forfeitScores, players: forfeitPlayers }) => {
      setIsOpponentDisconnected(false)
      clearDisconnectTimer()
      setScores(forfeitScores || {})
      setPlayers(forfeitPlayers || [])
      setWinnerId(forfeitWinnerId)
      setGameStatus('finished')
      sessionStorage.removeItem('currentMatchId')
    })

    socketInstance.on('battle:rejoined', ({ currentRound: activeRound, total, term, mode: activeMode, options, deadlineTs, matchId: serverMatchId }) => {
      setGameStatus('playing')
      setMode(activeMode)
      setTotalRounds(total)
      setCurrentRound(activeRound)
      setMatchId(serverMatchId || sessionStorage.getItem('currentMatchId') || '')
      setQuestion({
        term,
        options,
        deadlineTs
      })
      setIsOpponentDisconnected(false)
      clearDisconnectTimer()
    })

    socketInstance.on('battle:abandoned', () => {
      setGameStatus('abandoned')
      setIsOpponentDisconnected(false)
      clearDisconnectTimer()
      sessionStorage.removeItem('currentMatchId')
      setTimeout(() => {
        setGameStatus('idle')
      }, 3000)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      clearDisconnectTimer()
    }
  }, [user])

  const clearDisconnectTimer = () => {
    if (disconnectTimerRef.current) {
      clearInterval(disconnectTimerRef.current)
      disconnectTimerRef.current = null
    }
  }

  const resetGameState = () => {
    setGameStatus('idle')
    setRoomCode('')
    setMatchId('')
    setCurrentRound(0)
    setQuestion(null)
    setRoundResult(null)
    setScores({})
    setPlayers([])
    setWinnerId(null)
    setIsOpponentDisconnected(false)
    setOpponentDisconnectTimeLeft(15)
    clearDisconnectTimer()
  }

  // Socket Actions
  const joinQueue = (matchMode) => {
    setError(null)
    if (socket && isConnected) {
      setMode(matchMode)
      setGameStatus('searching')
      socket.emit('battle:queue:join', { mode: matchMode })
    }
  }

  const leaveQueue = () => {
    setError(null)
    if (socket && isConnected) {
      socket.emit('battle:queue:leave')
      resetGameState()
    }
  }

  const createRoom = (matchMode) => {
    setError(null)
    if (socket && isConnected) {
      setMode(matchMode)
      socket.emit('battle:room:create', { mode: matchMode })
    }
  }

  const joinRoom = (code) => {
    setError(null)
    if (socket && isConnected) {
      socket.emit('battle:room:join', { code })
    }
  }

  const leaveRoom = () => {
    setError(null)
    if (socket && isConnected) {
      socket.emit('battle:room:leave')
      resetGameState()
    }
  }

  const sendAnswer = (index, answer) => {
    if (socket && isConnected) {
      socket.emit('battle:answer', { index, answer })
    }
  }

  const rejoinMatch = (activeMatchId) => {
    if (socket && isConnected && activeMatchId) {
      socket.emit('battle:rejoin', { matchId: activeMatchId })
    }
  }

  const exitBattle = () => {
    resetGameState()
  }

  return (
    <BattleSocketContext.Provider
      value={{
        socket,
        isConnected,
        gameStatus,
        roomCode,
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
        error,
        setError,
        joinQueue,
        leaveQueue,
        createRoom,
        joinRoom,
        leaveRoom,
        sendAnswer,
        rejoinMatch,
        exitBattle
      }}
    >
      {children}
    </BattleSocketContext.Provider>
  )
}
