import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAdminLessonByIdApi,
  listAdminLessonSegmentsApi,
  createAdminLessonSegmentApi,
  updateAdminLessonSegmentApi,
  deleteAdminLessonSegmentApi,
  deleteMultipleLessonSegmentsApi
} from '../../adminApi'
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal'
import './AdminLessonSegmentsPage.css'

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const parseTime = (timeStr) => {
  const parts = timeStr.split(':')
  if (parts.length !== 2) return 0
  const minutes = parseInt(parts[0]) || 0
  const seconds = parseInt(parts[1]) || 0
  return (minutes * 60 + seconds) * 1000
}

const clampTimeValue = (value) => {
  const digits = value.replace(/\D/g, '').padEnd(4, '0').slice(0, 4)
  const minutes = Math.min(parseInt(digits.slice(0, 2), 10) || 0, 59)
  const seconds = Math.min(parseInt(digits.slice(2, 4), 10) || 0, 59)

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const moveToEditableTimePosition = (position, direction = 1) => {
  if (position === 2) return direction > 0 ? 3 : 1
  return Math.max(0, Math.min(position, 5))
}

const replaceTimeDigit = (value, position, digit) => {
  const nextPosition = moveToEditableTimePosition(position)
  const chars = clampTimeValue(value).split('')
  chars[nextPosition] = digit

  return {
    value: clampTimeValue(chars.join('')),
    position: moveToEditableTimePosition(nextPosition + 1)
  }
}

const clearTimeDigit = (value, position, direction) => {
  const targetPosition = moveToEditableTimePosition(position + direction, direction)
  const chars = clampTimeValue(value).split('')

  if (targetPosition >= 0 && targetPosition < chars.length && targetPosition !== 2) {
    chars[targetPosition] = '0'
  }

  return {
    value: clampTimeValue(chars.join('')),
    position: targetPosition
  }
}

const setTimeCaret = (input, position) => {
  requestAnimationFrame(() => input.setSelectionRange(position, position))
}

const handleTimeKeyDown = (event, value, setValue, clearError) => {
  const allowedKeys = [
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End'
  ]

  if (event.ctrlKey || event.metaKey || event.altKey || allowedKeys.includes(event.key)) return

  const input = event.currentTarget
  const selectionStart = input.selectionStart ?? 0

  if (/^\d$/.test(event.key)) {
    event.preventDefault()
    const next = replaceTimeDigit(value, selectionStart, event.key)
    setValue(next.value)
    clearError()
    setTimeCaret(input, next.position)
    return
  }

  if (event.key === 'Backspace' || event.key === 'Delete') {
    event.preventDefault()
    const next = clearTimeDigit(value, selectionStart, event.key === 'Backspace' ? -1 : 0)
    setValue(next.value)
    clearError()
    setTimeCaret(input, next.position)
    return
  }

  event.preventDefault()
}

const handleTimePaste = (event, setValue, clearError) => {
  event.preventDefault()
  const pastedValue = event.clipboardData.getData('text')
  const nextValue = clampTimeValue(pastedValue)
  setValue(nextValue)
  clearError()
  setTimeCaret(event.currentTarget, nextValue.length)
}

const isValidTimeValue = (value) => /^\d{2}:\d{2}$/.test(value) && value === clampTimeValue(value)

function AdminLessonSegmentsPage({ onNavigate, lessonId }) {
  const { t } = useTranslation()
  const iframeRef = useRef(null)
  const youtubePlayerRef = useRef(null)
  const playbackTimerRef = useRef(null)
  const selectedSegmentIdRef = useRef(null)
  const segmentsRef = useRef([])
  const segmentItemRefs = useRef({})
  const playerInitializedRef = useRef(false)

  // State
  const [lesson, setLesson] = useState(null)
  const [segments, setSegments] = useState([])
  const [selectedSegment, setSelectedSegment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [iframeReady, setIframeReady] = useState(false)

  // Form edit states
  const [editStartTime, setEditStartTime] = useState('00:00')
  const [editEndTime, setEditEndTime] = useState('00:00')
  const [editOriginal, setEditOriginal] = useState('')
  const [editTranslation, setEditTranslation] = useState('')

  // Form validation errors
  const [startTimeError, setStartTimeError] = useState('')
  const [endTimeError, setEndTimeError] = useState('')
  const [originalError, setOriginalError] = useState('')
  const [translationError, setTranslationError] = useState('')

  // Confirm Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Bulk select states
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  // Feedback Alerts states
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [autoActiveSegmentId, setAutoActiveSegmentId] = useState(null)

  // YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return ''
    try {
      const parsed = new URL(url)
      const host = parsed.hostname.replace(/^www\./, '')
      let videoId = ''

      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (parsed.pathname === '/watch') {
          videoId = parsed.searchParams.get('v') || ''
        } else if (parsed.pathname.startsWith('/embed/')) {
          videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] || ''
        } else if (parsed.pathname.startsWith('/shorts/')) {
          videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || ''
        }
      }

      if (host === 'youtu.be') {
        videoId = parsed.pathname.slice(1).split('/')[0]
      }

      if (!videoId) return ''

      const origin = typeof window !== 'undefined' ? `&origin=${window.location.origin}` : ''
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1${origin}`
    } catch {
      return ''
    }
  }

  const populateSegmentForm = (segment) => {
    setSelectedSegment(segment)

    if (segment._id === 'new') {
      setEditStartTime('00:00')
      setEditEndTime('00:00')
      setEditOriginal('')
      setEditTranslation('')
    } else {
      setEditStartTime(formatTime(segment.startMs || 0))
      setEditEndTime(formatTime(segment.endMs || 0))
      setEditOriginal(segment.transcript?.original || '')
      setEditTranslation(segment.translation || '')
    }
  }

  // Callback ref to detect iframe mount/remount
  const handleIframeRef = useCallback((node) => {
    iframeRef.current = node
    if (node) {
      playerInitializedRef.current = false
      setIframeReady(true)
    } else {
      setIframeReady(false)
    }
  }, [])

  const youtubeEmbedUrl = getYouTubeEmbedUrl(lesson?.sourceUrl)

  // Fetch Lesson & Segments
  const fetchData = useCallback(async (keepMessages = false) => {
    try {
      setLoading(true)
      setError(null)
      const [lessonRes, segmentsRes] = await Promise.all([
        getAdminLessonByIdApi(lessonId),
        listAdminLessonSegmentsApi(lessonId)
      ])
      
      const lessonData = lessonRes.data
      const segmentsData = segmentsRes.data || []
      
      setLesson(lessonData)
      setSegments(segmentsData)

      // Automatically select first segment if available
      if (segmentsData.length > 0 && !keepMessages) {
        handleSelectSegment(segmentsData[0])
      } else if (segmentsData.length === 0) {
        setSelectedSegment(null)
      }
    } catch (err) {
      setError(t('admin.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [lessonId, t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    segmentsRef.current = segments
  }, [segments])

  useEffect(() => {
    selectedSegmentIdRef.current = selectedSegment?._id || null
  }, [selectedSegment])

  // Select a segment to view details
  const handleSelectSegment = (segment) => {
    setSuccessMsg('')
    setErrorMsg('')
    clearErrors()
    setAutoActiveSegmentId(null)
    populateSegmentForm(segment)
    
    // Seek video to segment start time
    if (segment._id !== 'new' && youtubePlayerRef.current?.seekTo) {
      const startTimeInSeconds = (segment.startMs || 0) / 1000
      youtubePlayerRef.current.seekTo(startTimeInSeconds, true)
    }
  }

  useEffect(() => {
    if (!youtubeEmbedUrl || !iframeReady || !iframeRef.current || playerInitializedRef.current) return

    playerInitializedRef.current = true
    let isMounted = true

    const stopTracking = () => {
      if (playbackTimerRef.current) {
        window.clearInterval(playbackTimerRef.current)
        playbackTimerRef.current = null
      }
    }

    const scrollSegmentIntoView = (segmentId) => {
      segmentItemRefs.current[segmentId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }

    const selectSegmentByPlayback = () => {
      const player = youtubePlayerRef.current
      if (!player?.getCurrentTime) return

      const currentMs = player.getCurrentTime() * 1000
      const activeSegment = segmentsRef.current.find((segment) => (
        segment._id !== 'new' &&
        currentMs >= (segment.startMs || 0) &&
        currentMs <= (segment.endMs || 0)
      ))

      if (!activeSegment || activeSegment._id === selectedSegmentIdRef.current) return

      selectedSegmentIdRef.current = activeSegment._id
      setAutoActiveSegmentId(activeSegment._id)
      clearErrors()
      populateSegmentForm(activeSegment)
      scrollSegmentIntoView(activeSegment._id)
    }

    const startTracking = () => {
      if (playbackTimerRef.current) return
      selectSegmentByPlayback()
      playbackTimerRef.current = window.setInterval(selectSegmentByPlayback, 300)
    }

    const onStateChange = (event) => {
      if (event.data === window.YT.PlayerState.PLAYING) {
        startTracking()
      } else {
        stopTracking()
      }
    }

    const createPlayer = () => {
      if (!isMounted || !window.YT?.Player || !iframeRef.current) return

      // Destroy existing player if any
      if (youtubePlayerRef.current?.destroy) {
        try {
          youtubePlayerRef.current.destroy()
        } catch (e) {
          // Ignore destroy errors
        }
        youtubePlayerRef.current = null
      }

      try {
        youtubePlayerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onStateChange,
            onReady: () => {
              console.log('YouTube Player ready')
            }
          }
        })
      } catch (e) {
        console.error('Error creating YouTube player:', e)
      }
    }

    if (window.YT?.Player) {
      setTimeout(createPlayer, 100)
    } else {
      const script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      if (!script) {
        const newScript = document.createElement('script')
        newScript.src = 'https://www.youtube.com/iframe_api'
        newScript.onload = () => {
          window.onYouTubeIframeAPIReady = () => {
            setTimeout(createPlayer, 100)
          }
        }
        document.body.appendChild(newScript)
      } else {
        window.onYouTubeIframeAPIReady = () => {
          setTimeout(createPlayer, 100)
        }
      }
    }

    return () => {
      isMounted = false
      stopTracking()
      if (youtubePlayerRef.current?.destroy) {
        try {
          youtubePlayerRef.current.destroy()
        } catch (e) {
          // Ignore destroy errors
        }
        youtubePlayerRef.current = null
      }
    }
  }, [youtubeEmbedUrl, iframeReady])

  // Handle click to create a new segment
  const handleAddNewSegment = () => {
    setSuccessMsg('')
    setErrorMsg('')
    clearErrors()
    
    const newSegment = {
      _id: 'new',
      startMs: 0,
      endMs: 0,
      transcript: { original: '' },
      translation: ''
    }
    setSelectedSegment(newSegment)
    setEditStartTime('00:00')
    setEditEndTime('00:00')
    setEditOriginal('')
    setEditTranslation('')
  }

  // Clear validation errors
  const clearErrors = () => {
    setStartTimeError('')
    setEndTimeError('')
    setOriginalError('')
    setTranslationError('')
  }

  // Validate form
  const validateForm = () => {
    let valid = true
    clearErrors()

    const startMs = parseTime(editStartTime)
    const endMs = parseTime(editEndTime)

    if (!editStartTime.trim() || !isValidTimeValue(editStartTime)) {
      setStartTimeError(t('admin.segmentStartTimeError'))
      valid = false
    }

    if (!editEndTime.trim() || !isValidTimeValue(editEndTime)) {
      setEndTimeError(t('admin.segmentEndTimeError'))
      valid = false
    }

    if (startMs >= endMs) {
      setEndTimeError(t('admin.segmentEndTimeGreaterError'))
      valid = false
    }

    if (!editOriginal.trim()) {
      setOriginalError(t('admin.segmentOriginalRequired'))
      valid = false
    }

    if (!editTranslation.trim()) {
      setTranslationError(t('admin.segmentTranslationRequired'))
      valid = false
    }

    return valid
  }

  // Handle form Save
  const handleSaveChanges = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSuccessMsg('')
    setErrorMsg('')

    try {
      const startMs = parseTime(editStartTime)
      const endMs = parseTime(editEndTime)

      const payload = {
        startMs,
        endMs,
        transcript: {
          original: editOriginal.trim(),
          normalized: editOriginal.trim() // Auto-set normalized = original
        },
        translation: editTranslation.trim()
      }

      let successMessage = ''
      let createdSegmentId = null

      if (selectedSegment._id === 'new') {
        // Create new
        const response = await createAdminLessonSegmentApi(lessonId, payload)
        createdSegmentId = response.data._id
        successMessage = t('api.success.SEGMENT_CREATED_SUCCESS')
      } else {
        // Update existing
        await updateAdminLessonSegmentApi(lessonId, selectedSegment._id, payload)
        successMessage = t('api.success.SEGMENT_UPDATED_SUCCESS')
      }

      // Re-fetch segments
      const segmentsRes = await listAdminLessonSegmentsApi(lessonId)
      const segmentsData = segmentsRes.data || []
      setSegments(segmentsData)

      // Auto-select the newly created segment or keep the current one
      if (createdSegmentId) {
        const newSegment = segmentsData.find(s => s._id === createdSegmentId)
        if (newSegment) {
          handleSelectSegment(newSegment)
        }
      } else if (selectedSegment._id !== 'new') {
        const updatedSegment = segmentsData.find(s => s._id === selectedSegment._id)
        if (updatedSegment) {
          handleSelectSegment(updatedSegment)
        }
      }
      
      // Show success message after fetch completes
      setSuccessMsg(successMessage)
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
    } catch (err) {
      const code = err.response?.data?.code
      setErrorMsg(code ? t('api.error.' + code) : (err.response?.data?.message || t('admin.segmentActionError')))
      setTimeout(() => {
        setErrorMsg('')
      }, 3000)
    }
  }

  // Handle delete click
  const handleDeleteClick = () => {
    if (selectedSegment && selectedSegment._id !== 'new') {
      setIsDeleteModalOpen(true)
    }
  }

  // Confirm delete segment
  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false)
    if (!selectedSegment || selectedSegment._id === 'new') return
    setSuccessMsg('')
    setErrorMsg('')

    try {
      await deleteAdminLessonSegmentApi(lessonId, selectedSegment._id)
      
      // Re-fetch segments without resetting state
      const segmentsRes = await listAdminLessonSegmentsApi(lessonId)
      const segmentsData = segmentsRes.data || []
      setSegments(segmentsData)

      // Clear selected segment or select first available
      if (segmentsData.length > 0) {
        handleSelectSegment(segmentsData[0])
      } else {
        setSelectedSegment(null)
      }

      setSuccessMsg(t('api.success.SEGMENT_DELETED_SUCCESS'))
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
    } catch (err) {
      const code = err.response?.data?.code
      setErrorMsg(code ? t('api.error.' + code) : (err.response?.data?.message || t('admin.segmentDeleteError')))
      setTimeout(() => {
        setErrorMsg('')
      }, 3000)
    }
  }

  // Bulk select handlers
  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setIsSelectMode(false)
      setSelectedIds(new Set())
    } else {
      setIsSelectMode(true)
    }
  }

  const handleToggleSelect = (segmentId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(segmentId)) {
        next.delete(segmentId)
      } else {
        next.add(segmentId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const allIds = new Set(segments.filter(s => s._id !== 'new').map(s => s._id))
    setSelectedIds(allIds)
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleBulkDeleteClick = () => {
    if (selectedIds.size > 0) {
      setIsBulkDeleteModalOpen(true)
    }
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return
    try {
      const segmentIds = Array.from(selectedIds)
      await deleteMultipleLessonSegmentsApi(lessonId, segmentIds)
      setSuccessMsg(t('api.success.SEGMENT_DELETED_SUCCESS'))
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)

      // Re-fetch data
      setIsSelectMode(false)
      setSelectedIds(new Set())
      const segmentsRes = await listAdminLessonSegmentsApi(lessonId)
      const segmentsData = segmentsRes.data || []
      setSegments(segmentsData)

      if (segmentsData.length > 0) {
        handleSelectSegment(segmentsData[0])
      } else {
        setSelectedSegment(null)
      }
    } catch (err) {
      const code = err.response?.data?.code
      setErrorMsg(code ? t('api.error.' + code) : (err.response?.data?.message || t('admin.segmentDeleteError')))
      setTimeout(() => {
        setErrorMsg('')
      }, 3000)
    } finally {
      setIsBulkDeleteModalOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
        <span>{t('admin.loading')}</span>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="admin-error-message">
        {error || t('admin.lessonNotFound')}
      </div>
    )
  }

  return (
    <div className="admin-lesson-segments-page">
      {/* Breadcrumb */}
      <div className="admin-segment-breadcrumbs">
        <span className="breadcrumb-link" onClick={() => onNavigate('/admin/lessons')}>
          {t('admin.lessonsBreadcrumb') || 'Bài học'}
        </span>
        <svg className="breadcrumb-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="breadcrumb-link" onClick={() => onNavigate(`/admin/lessons/${lessonId}/edit`)}>
          {lesson.title}
        </span>
        <svg className="breadcrumb-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="breadcrumb-current">{t('admin.segmentsBreadcrumb') || 'Phân đoạn'}</span>
      </div>

      {/* Alerts */}
      {successMsg && <div className="admin-alert success" style={{ marginBottom: '16px' }}>{successMsg}</div>}
      {errorMsg && <div className="admin-alert error" style={{ marginBottom: '16px' }}>{errorMsg}</div>}

      {/* Main Grid Content */}
      <div className="admin-segment-grid">
        {/* Left column: Segment List */}
        <div className="admin-segment-left-col">
          <h1 className="admin-segment-lesson-title">{lesson.title}</h1>

          <div className="admin-segment-col-header">
            <h2 className="admin-segment-col-title">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
                <rect x="3" y="4" width="18" height="4" rx="1" />
                <rect x="3" y="12" width="18" height="4" rx="1" />
                <rect x="3" y="20" width="18" height="4" rx="1" />
              </svg>
              {t('admin.segmentListTitle') || 'Phân đoạn'} ({segments.length})
            </h2>
            <div className="admin-segment-col-actions">
              {/* Select Mode Button */}
              <button
                type="button"
                className={`admin-segment-select-mode-btn ${isSelectMode ? 'active' : ''}`}
                onClick={handleToggleSelectMode}
                title={isSelectMode ? t('admin.cancelSelectModeBtn') : t('admin.selectModeBtn')}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                {isSelectMode ? t('admin.cancelSelectModeBtn') || 'Hủy chọn' : t('admin.selectModeBtn') || 'Chọn'}
              </button>
              <button className="admin-add-segment-btn" onClick={handleAddNewSegment}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t('admin.addSegmentBtn') || 'Thêm Phân đoạn'}
              </button>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {isSelectMode && segments.filter(s => s._id !== 'new').length > 0 && (
            <div className="admin-segment-bulk-bar">
              <div className="admin-bulk-left">
                <label className="admin-bulk-checkbox-label">
                  <input
                    type="checkbox"
                    className="admin-bulk-checkbox"
                    checked={selectedIds.size === segments.filter(s => s._id !== 'new').length}
                    onChange={selectedIds.size === segments.filter(s => s._id !== 'new').length ? handleDeselectAll : handleSelectAll}
                  />
                  <span>{selectedIds.size === segments.filter(s => s._id !== 'new').length ? t('admin.deselectAllBtn') || 'Bỏ chọn tất cả' : t('admin.selectAllBtn') || 'Chọn tất cả'}</span>
                </label>
              </div>
              <button
                type="button"
                className="admin-bulk-delete-btn"
                disabled={selectedIds.size === 0}
                onClick={handleBulkDeleteClick}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {t('admin.deleteSelectedBtn', { count: selectedIds.size }) || `Xóa đã chọn (${selectedIds.size})`}
              </button>
            </div>
          )}

          <div className="admin-segment-list">
            {segments.map((segment, index) => {
              const isSelected = selectedSegment && selectedSegment._id === segment._id
              const displayIndex = String(index + 1).padStart(2, '0')
              const isChecked = selectedIds.has(segment._id)

              return (
                <div
                  key={segment._id}
                  ref={(node) => {
                    if (node) {
                      segmentItemRefs.current[segment._id] = node
                    } else {
                      delete segmentItemRefs.current[segment._id]
                    }
                  }}
                  onClick={() => {
                    if (isSelectMode && segment._id !== 'new') {
                      handleToggleSelect(segment._id)
                    } else {
                      handleSelectSegment(segment)
                    }
                  }}
                  className={`admin-segment-item ${isSelected ? 'selected' : ''} ${autoActiveSegmentId === segment._id ? 'auto-active' : ''} ${isSelectMode ? 'select-mode' : ''} ${isChecked ? 'checked' : ''}`}
                >
                  {/* Select checkbox in select mode */}
                  {isSelectMode && segment._id !== 'new' && (
                    <div className="admin-segment-select-box">
                      <input
                        type="checkbox"
                        className="admin-segment-select-checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(segment._id)}
                      />
                    </div>
                  )}

                  {/* Segment time and content */}
                  <div className="admin-segment-item-details">
                    <div className="admin-segment-time-row">
                      <span className={`admin-segment-index-badge ${isSelected ? 'selected' : ''}`}>
                        #{displayIndex}
                      </span>
                      <span className="segment-time-start">{formatTime(segment.startMs)}</span>
                      <span className="segment-time-separator">{t('admin.segmentTimeSeparator') || 'ĐẾN'}</span>
                      <span className="segment-time-end">{formatTime(segment.endMs)}</span>
                    </div>
                    <div className="admin-segment-text-row">
                      <div className="segment-text-box">
                        <span className="segment-text-label">{t('admin.segmentOriginalLabel') || 'BẢN GHI TIẾNG ANH'}</span>
                        <p className="segment-original">{segment.transcript?.original}</p>
                      </div>
                      <div className="segment-text-box">
                        <span className="segment-text-label">{t('admin.segmentTranslationLabel') || 'BẢN DỊCH TIẾNG VIỆT'}</span>
                        <p className="segment-translation">{segment.translation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {!isSelectMode && (
                    <div className="admin-segment-item-actions">
                      <button className="admin-segment-edit-btn" title={t('admin.editSegment')} onClick={(e) => {
                        e.stopPropagation()
                        handleSelectSegment(segment)
                      }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column: Segment Details */}
        <div className="admin-segment-right-col">
          <div className="admin-segment-preview-box">
            <span className="preview-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t('admin.previewLabel') || 'Trình xem trước'}
            </span>
            <div className="admin-segment-video-preview">
              {youtubeEmbedUrl ? (
                <iframe
                  key={`youtube-${youtubeEmbedUrl}-${t('common')}`}
                  ref={handleIframeRef}
                  src={youtubeEmbedUrl}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="admin-segment-preview-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {selectedSegment ? (
            <form className="admin-segment-details-form" onSubmit={handleSaveChanges}>
              <div className="admin-segment-details-header">
                <div>
                  <h2 className="admin-segment-details-title">
                    {selectedSegment._id === 'new' 
                      ? (t('admin.newSegmentTitle') || 'Phân đoạn mới')
                      : (t('admin.editSegmentTitle') || 'Chi tiết Phân đoạn')}
                  </h2>
                  {selectedSegment._id !== 'new' && (
                    <p className="admin-segment-current-info">
                      {t('admin.segmentNumberLabel') || 'Phân đoạn'} #{segments.findIndex(s => s._id === selectedSegment._id) + 1} • {formatTime(selectedSegment.startMs)} - {formatTime(selectedSegment.endMs)}
                    </p>
                  )}
                </div>
                {selectedSegment._id !== 'new' && (
                  <button type="button" className="admin-delete-segment-btn" title={t('admin.deleteSegment')} onClick={handleDeleteClick}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Time inputs */}
              <div className="admin-segment-time-inputs">
                <div className="form-group">
                  <label className="form-label">{t('admin.segmentStartTimeLabel') || 'THỜI GIAN BẮT ĐẦU'}</label>
                  <input
                    type="text"
                    placeholder="00:00"
                    value={editStartTime}
                    onChange={(e) => {
                      setEditStartTime(clampTimeValue(e.target.value))
                      if (startTimeError) setStartTimeError('')
                    }}
                    onKeyDown={(e) => {
                      handleTimeKeyDown(e, editStartTime, setEditStartTime, () => setStartTimeError(''))
                    }}
                    onPaste={(e) => {
                      handleTimePaste(e, setEditStartTime, () => setStartTimeError(''))
                    }}
                    inputMode="numeric"
                    maxLength={5}
                    className={`form-input ${startTimeError ? 'error' : ''}`}
                  />
                  {startTimeError && <span className="form-error">{startTimeError}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">{t('admin.segmentEndTimeLabel') || 'THỜI GIAN KẾT THÚC'}</label>
                  <input
                    type="text"
                    placeholder="00:00"
                    value={editEndTime}
                    onChange={(e) => {
                      setEditEndTime(clampTimeValue(e.target.value))
                      if (endTimeError) setEndTimeError('')
                    }}
                    onKeyDown={(e) => {
                      handleTimeKeyDown(e, editEndTime, setEditEndTime, () => setEndTimeError(''))
                    }}
                    onPaste={(e) => {
                      handleTimePaste(e, setEditEndTime, () => setEndTimeError(''))
                    }}
                    inputMode="numeric"
                    maxLength={5}
                    className={`form-input ${endTimeError ? 'error' : ''}`}
                  />
                  {endTimeError && <span className="form-error">{endTimeError}</span>}
                </div>
              </div>

              {/* Transcript inputs */}
              <div className="form-group">
                <label className="form-label">{t('admin.segmentOriginalLabel') || 'BẢN GHI TIẾNG ANH'}</label>
                <textarea
                  placeholder={t('admin.segmentOriginalPlaceholder') || 'Nhập bản ghi tiếng Anh...'}
                  value={editOriginal}
                  onChange={(e) => {
                    setEditOriginal(e.target.value)
                    if (originalError) setOriginalError('')
                  }}
                  className={`form-textarea ${originalError ? 'error' : ''}`}
                  rows={3}
                />
                {originalError && <span className="form-error">{originalError}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">{t('admin.segmentTranslationLabel') || 'BẢN DỊCH TIẾNG VIỆT'}</label>
                <textarea
                  placeholder={t('admin.segmentTranslationPlaceholder') || 'Nhập bản dịch tiếng Việt...'}
                  value={editTranslation}
                  onChange={(e) => {
                    setEditTranslation(e.target.value)
                    if (translationError) setTranslationError('')
                  }}
                  className={`form-textarea ${translationError ? 'error' : ''}`}
                  rows={3}
                />
                {translationError && <span className="form-error">{translationError}</span>}
              </div>

              {/* Action buttons */}
              <div className="admin-segment-form-actions">
                <button type="button" className="admin-cancel-segment-btn" onClick={() => setSelectedSegment(null)}>
                  {t('admin.cancelBtn') || 'Hủy'}
                </button>
                <button type="submit" className="admin-save-segment-btn">
                  {t('admin.saveChangesBtn') || 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          ) : (
            <div className="admin-segment-empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="4" rx="1" />
                <rect x="3" y="12" width="18" height="4" rx="1" />
                <rect x="3" y="20" width="18" height="4" rx="1" />
              </svg>
              <p>{t('admin.selectSegmentPrompt') || 'Chọn một phân đoạn để xem chi tiết hoặc thêm phân đoạn mới.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Single Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={t('admin.confirmDeleteSegmentTitle') || 'Xóa phân đoạn này?'}
        message={t('admin.confirmDeleteSegmentMessage') || 'Bạn có chắc chắn muốn xóa phân đoạn này? Hành động này không thể hoàn tác.'}
        confirmText={t('admin.deleteBtn') || 'Xóa'}
        cancelText={t('admin.cancelBtn') || 'Hủy'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDanger={true}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title={t('admin.confirmDeleteMultipleSegmentsTitle') || 'Xóa các phân đoạn đã chọn'}
        message={t('admin.confirmDeleteMultipleSegmentsMessage', { count: selectedIds.size }) || `Bạn có chắc chắn muốn xóa ${selectedIds.size} phân đoạn đã chọn? Hành động này không thể hoàn tác.`}
        confirmText={t('admin.deleteBtn') || 'Xóa'}
        cancelText={t('admin.cancelBtn') || 'Hủy'}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
        isDanger={true}
      />
    </div>
  )
}

export default AdminLessonSegmentsPage