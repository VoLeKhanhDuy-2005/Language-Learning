import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getBattleHistory } from '../../profileApi'
import { getLessons } from '../../../lessons/lessonsApi'
import MatchDetailModal from '../../../battle/components/MatchDetailModal'
import Pagination from '../../../../components/Pagination/Pagination'
import './HistoryModal.css'

function HistoryModal({ onClose, lessonsMap, user, onNavigate }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('lessons')

  // Lesson history
  const [lessons, setLessons] = useState([])
  const [lessonsLoading, setLessonsLoading] = useState(true)
  const [lessonPage, setLessonPage] = useState(1)
  const [lessonTotalPages, setLessonTotalPages] = useState(1)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [lessonSearchQuery, setLessonSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Battle history
  const [battles, setBattles] = useState([])
  const [battleTotalPages, setBattleTotalPages] = useState(1)
  const [battlePage, setBattlePage] = useState(1)
  const [battleLoading, setBattleLoading] = useState(true)
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [battleSearchQuery, setBattleSearchQuery] = useState('')
  const [debouncedBattleSearchQuery, setDebouncedBattleSearchQuery] = useState('')

  const loadLessonProgress = useCallback(async () => {
    setLessonsLoading(true)
    try {
      const params = {
        page: lessonPage,
        limit: 7,
        q: debouncedSearchQuery || undefined
      }
      const res = await getLessons(params)
      if (res.success) {
        const data = res.data?.lessons || []
        // Map lesson with userProgress data (null if no progress)
        const lessonsWithData = data.map((l) => ({
          ...l.lesson,
          userProgress: l.userProgress,
          lastStudiedAt: l.userProgress?.updatedAt || l.userProgress?.createdAt || null
        }))
        setLessons(lessonsWithData)
        // Use totalPages from API response
        if (res.data?.pagination) {
          setLessonTotalPages(res.data.pagination.totalPages || 1)
        }
      }
    } catch (err) {
      console.error('Failed to load lessons:', err)
    } finally {
      setLessonsLoading(false)
    }
  }, [lessonPage, debouncedSearchQuery])

  // Debounce search for lessons
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(lessonSearchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [lessonSearchQuery])

  // Reset lesson page to 1 when search changes
  useEffect(() => {
    setLessonPage(1)
  }, [debouncedSearchQuery])

  // Debounce search for battles
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBattleSearchQuery(battleSearchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [battleSearchQuery])

  // Reset battle page to 1 when search changes
  useEffect(() => {
    setBattlePage(1)
  }, [debouncedBattleSearchQuery])


  const loadBattleHistory = useCallback(async () => {
    setBattleLoading(true)
    try {
      const res = await getBattleHistory(battlePage, 10)
      if (res.success) {
        const items = res.data?.items || []
        // Client-side filtering for search
        let filteredItems = items
        if (debouncedBattleSearchQuery && debouncedBattleSearchQuery.trim()) {
          const searchLower = debouncedBattleSearchQuery.trim().toLowerCase()
          filteredItems = items.filter(match => {
            const modeText = match.mode === 'mcq' ? t('battle.modeMcq') : t('battle.modeTyping')
            const typeText = match.matchType === 'queue' ? t('battle.typeQueue') : t('battle.typeInvite')
            return modeText.toLowerCase().includes(searchLower) || 
                   typeText.toLowerCase().includes(searchLower)
          })
        }
        setBattles(filteredItems)
        // Calculate totalPages from total and limit
        const total = res.data?.total || 0
        setBattleTotalPages(Math.ceil(total / 10) || 1)
      }
    } catch (err) {
      console.error('Failed to load battle history:', err)
    } finally {
      setBattleLoading(false)
    }
  }, [battlePage, debouncedBattleSearchQuery, t])

  useEffect(() => {
    loadLessonProgress()
    loadBattleHistory()
  }, [])

  useEffect(() => {
    loadLessonProgress()
  }, [lessonPage, loadLessonProgress])

  useEffect(() => {
    loadBattleHistory()
  }, [battlePage, loadBattleHistory])

  const handleLessonPageChange = (page) => {
    setLessonPage(page)
  }

  const handleBattlePageChange = (page) => {
    setBattlePage(page)
  }

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson)
  }

  const handleSelectMode = (mode) => {
    if (!selectedLesson) return
    const lessonId = selectedLesson._id
    setSelectedLesson(null)
    if (onNavigate) {
      onNavigate(`/lessons/${mode}/${lessonId}`)
    }
  }

  const handleViewBattleDetail = (matchId) => {
    setSelectedMatchId(matchId)
    setIsDetailOpen(true)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString()
  }

  const getOverallStatus = (lesson) => {
    const dictationStatus = lesson.userProgress?.dictation?.status
    const shadowingStatus = lesson.userProgress?.shadowing?.status

    if (dictationStatus === 'completed' && shadowingStatus === 'completed') {
      return 'completed'
    } else if (dictationStatus === 'in_progress' || shadowingStatus === 'in_progress') {
      return 'in_progress'
    } else {
      return 'not_started'
    }
  }

  return (
    <div className="hm-overlay" onClick={onClose}>
      <div className="hm-container" onClick={(e) => e.stopPropagation()}>
        <div className="hm-header">
          <h3 className="hm-title">{t('profile.historyModalTitle')}</h3>
          <button className="hm-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="hm-tabs">
          <button
            className={`hm-tab ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            {t('profile.historyLessons')}
          </button>
          <button
            className={`hm-tab ${activeTab === 'battle' ? 'active' : ''}`}
            onClick={() => setActiveTab('battle')}
          >
            {t('profile.historyBattle')}
          </button>
        </div>

        <div className="hm-search-filter">
          <input
            type="text"
            className="hm-search-input"
            placeholder={activeTab === 'lessons' ? t('profile.searchLessonPlaceholder') : t('profile.searchBattlePlaceholder')}
            value={activeTab === 'lessons' ? lessonSearchQuery : battleSearchQuery}
            onChange={(e) => {
              if (activeTab === 'lessons') {
                setLessonSearchQuery(e.target.value)
              } else {
                setBattleSearchQuery(e.target.value)
              }
            }}
          />
        </div>

        <div className="hm-body">
          {/* Tab 1: Lesson History */}
          {activeTab === 'lessons' && (
            lessonsLoading ? (
              <div className="hm-loading-state">{t('profile.loading')}</div>
            ) : lessons.length > 0 ? (
              <>
                <table className="hm-table">
                  <thead>
                    <tr>
                      <th>{t('profile.tableLessonName')}</th>
                      <th>{t('profile.tableDictation')}</th>
                      <th>{t('profile.tableShadowing')}</th>
                      <th>{t('profile.tableStatus')}</th>
                      <th>{t('profile.tableDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((lesson) => {
                      const dictationPct = lesson.userProgress?.dictation?.progressPct || 0
                      const shadowingPct = lesson.userProgress?.shadowing?.progressPct || 0
                      const status = getOverallStatus(lesson)
                      return (
                        <tr
                          key={lesson._id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleLessonClick(lesson)}
                        >
                          <td style={{ fontWeight: 600 }}>{lesson.title}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-surface-container)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                                <div style={{ width: `${dictationPct}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 500, minWidth: '35px' }}>{dictationPct}%</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-surface-container)', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                                <div style={{ width: `${shadowingPct}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '3px' }} />
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 500, minWidth: '35px' }}>{shadowingPct}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`hm-status-pill ${status === 'completed' ? 'completed' : status === 'in_progress' ? 'in_progress' : 'not_started'}`}>
                              {status === 'completed' ? t('profile.completed') : status === 'in_progress' ? t('profile.learning') : t('profile.notStarted')}
                            </span>
                          </td>
                          <td>{formatDate(lesson.lastStudiedAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    currentPage={lessonPage}
                    totalPages={lessonTotalPages}
                    onPageChange={handleLessonPageChange}
                  />
                </div>
              </>
            ) : (
              <div className="hm-empty">{t('profile.noLessonHistory')}</div>
            )
          )}


          {/* Tab 3: Battle History */}
          {activeTab === 'battle' && (
            battleLoading ? (
              <div className="hm-loading-state">{t('profile.loading')}</div>
            ) : battles.length > 0 ? (
              <>
                <table className="hm-table">
                  <thead>
                    <tr>
                      <th>{t('profile.tableMode')}</th>
                      <th>{t('profile.tableType')}</th>
                      <th>{t('profile.tableResult')}</th>
                      <th>{t('profile.tableScore')}</th>
                      <th>{t('profile.tableCorrectCount')}</th>
                      <th>{t('profile.tableDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {battles.map((match, idx) => {
                      const playerData = match.players?.find(p => p.userId?._id === user?.id)
                      const userScore = playerData?.score ?? 0
                      const userCorrectCount = playerData?.correctCount ?? 0
                      const winnerId = typeof match.winnerId === 'object' ? match.winnerId?._id : match.winnerId
                      const isWinner = winnerId === user?.id
                      const isDraw = match.winnerId === null
                      return (
                        <tr
                          key={match._id || idx}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleViewBattleDetail(match._id)}
                        >
                          <td style={{ fontWeight: 600 }}>
                            {match.mode === 'mcq' ? t('battle.modeMcq') : t('battle.modeTyping')}
                          </td>
                          <td>
                            {match.matchType === 'queue' ? t('battle.typeQueue') : t('battle.typeInvite')}
                          </td>
                          <td>
                            <span className={`hm-status-pill ${isDraw ? 'draw' : isWinner ? 'completed' : 'in_progress'}`}>
                              {isDraw ? t('profile.draw') : isWinner ? t('profile.win') : t('profile.lose')}
                            </span>
                          </td>
                          <td>{userScore}</td>
                          <td>{userCorrectCount}</td>
                          <td>{formatDate(match.finishedAt || match.createdAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    currentPage={battlePage}
                    totalPages={battleTotalPages}
                    onPageChange={handleBattlePageChange}
                  />
                </div>
              </>
            ) : (
              <div className="hm-empty">{t('profile.noBattleHistory')}</div>
            )
          )}
        </div>
      </div>

      {/* Match Detail Modal */}
      {isDetailOpen && (
        <MatchDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedMatchId(null)
          }}
          matchId={selectedMatchId}
        />
      )}

      {/* Mode Selection Modal */}
      {selectedLesson && (
        <div className="modal-overlay" onClick={() => setSelectedLesson(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('lessons.selectModeTitle')}</h3>
              <p className="modal-subtitle">{selectedLesson.title}</p>
              <button className="modal-close-icon-btn" onClick={() => setSelectedLesson(null)} aria-label="Close">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Dictation Card */}
              <button
                className={`mode-select-card ${!selectedLesson.modes?.includes('dictation') ? 'disabled' : ''}`}
                onClick={() => selectedLesson.modes?.includes('dictation') && handleSelectMode('dictation')}
                disabled={!selectedLesson.modes?.includes('dictation')}
              >
                <div className="mode-card-icon-wrapper icon-blue">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="mode-card-info">
                  <h4 className="mode-card-title">Dictation</h4>
                  <p className="mode-card-desc">{t('lessons.dictationDesc')}</p>
                </div>
              </button>

              {/* Shadowing Card */}
              <button
                className={`mode-select-card ${!selectedLesson.modes?.includes('shadowing') ? 'disabled' : ''}`}
                onClick={() => selectedLesson.modes?.includes('shadowing') && handleSelectMode('shadowing')}
                disabled={!selectedLesson.modes?.includes('shadowing')}
              >
                <div className="mode-card-icon-wrapper icon-red">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.2 6 6.72V21h2v-3.28c3.28-.48 6-3.26 6-6.72h-1.7z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="mode-card-info">
                  <h4 className="mode-card-title">Shadowing</h4>
                  <p className="mode-card-desc">{t('lessons.shadowingDesc')}</p>
                </div>
              </button>
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setSelectedLesson(null)}>
                {t('lessons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryModal