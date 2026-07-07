import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import './LessonYoutubePlayer.css'

const LessonYoutubePlayer = forwardRef(({ lesson, videoId, startMs, endMs, onPlayerReadyStateChange }, ref) => {
  const playerRef = useRef(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  // Hàm tiện ích lấy giây
  const getStartSec = () => Math.floor((startMs || 0) / 1000)
  const getEndSec = () => Math.ceil((endMs || 0) / 1000)

  // Cung cấp các hàm điều khiển cho component cha
  useImperativeHandle(ref, () => ({
    replay: () => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(getStartSec(), true)
        playerRef.current.playVideo()
      }
    },
    play: () => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo()
      }
    },
    pause: () => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo()
      }
    },
    seekTo: (seconds, allowSeekAhead) => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, allowSeekAhead)
      }
    },
    getPlayer: () => playerRef.current,
    isReady: () => isPlayerReady
  }))

  // Khởi tạo YouTube Iframe API nếu chưa có
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

      const previousCallback = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback()
        window.dispatchEvent(new Event('youtube-api-ready'))
      }
    }
  }, [])

  // Khởi tạo trình phát YouTube Player
  useEffect(() => {
    if (!videoId) return

    let active = true
    let checkInterval = null

    const initPlayer = () => {
      if (!active) return
      if (playerRef.current) return

      const container = document.getElementById('lesson-yt-player')
      if (!container) {
        setTimeout(initPlayer, 50)
        return
      }

      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('lesson-yt-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            showinfo: 0,
            enablejsapi: 1
          },
          events: {
            onReady: (event) => {
              if (!active) return
              setIsPlayerReady(true)
              if (onPlayerReadyStateChange) onPlayerReadyStateChange(true)
              
              // Tua đến phân đoạn hiện tại
              event.target.seekTo(getStartSec(), true)
              event.target.playVideo()
            }
          }
        })
      }
    }

    const handleApiReady = () => {
      initPlayer()
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.addEventListener('youtube-api-ready', handleApiReady)
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          initPlayer()
          clearInterval(checkInterval)
        }
      }, 500)
    }

    return () => {
      active = false
      window.removeEventListener('youtube-api-ready', handleApiReady)
      if (checkInterval) clearInterval(checkInterval)
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy()
        playerRef.current = null
        setIsPlayerReady(false)
        if (onPlayerReadyStateChange) onPlayerReadyStateChange(false)
      }
    }
  }, [videoId])

  // Tự động tua và phát khi thay đổi phân đoạn (startMs/endMs thay đổi)
  useEffect(() => {
    if (isPlayerReady && playerRef.current) {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(getStartSec(), true)
        playerRef.current.playVideo()
      }
    }
  }, [startMs, isPlayerReady])

  // Theo dõi thời gian của video để tự động tạm dừng khi hết phân đoạn
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return

    const intervalId = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime()
        const endSec = getEndSec()
        if (currentTime >= endSec) {
          if (typeof playerRef.current.pauseVideo === 'function') {
            playerRef.current.pauseVideo()
          }
          if (typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(getStartSec(), true)
          }
        }
      }
    }, 200)

    return () => {
      clearInterval(intervalId)
    }
  }, [startMs, endMs, isPlayerReady])

  return (
    <aside className="lesson-player-aside">
      <div className="media-player-card">
        <div className="media-preview-container">
          {videoId ? (
            <div id="lesson-yt-player" className="media-iframe"></div>
          ) : (
            <div className="media-preview-placeholder">
              <img src={lesson?.thumbnailUrl || '/hero.jpg'} alt={lesson?.title} className="media-thumbnail" />
            </div>
          )}
        </div>

        <div className="media-info-box">
          <h2 className="media-lesson-title">{lesson?.title}</h2>
          <p className="media-lesson-desc">
            {lesson?.description || 'Practice your speaking alignment and tone matching with YouTube segments.'}
          </p>
        </div>
      </div>
    </aside>
  )
})

export default LessonYoutubePlayer
