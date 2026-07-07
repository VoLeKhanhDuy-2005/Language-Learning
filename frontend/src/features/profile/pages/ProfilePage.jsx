import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '../../../components/Input/Input'
import { useAuth } from '../../../context/AuthContext'
import {
  getProfileStats,
  updateProfile as updateProfileApi,
  getGamificationProfile,
  getMyRank,
  getMyStreak,
  getBattleHistory,
} from '../profileApi'
import { getLessons } from '../../lessons/lessonsApi'
import { getPresignedUrl } from '../../../utils/s3Upload'
import { validateImageMagicBytes } from '../../../utils/imageValidation'
import ChangePasswordModal from '../components/ChangePasswordModal/ChangePasswordModal'
import HistoryModal from '../components/HistoryModal/HistoryModal'
import './ProfilePage.css'

function ProfilePage({ onNavigate }) {
  const { t } = useTranslation()
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Profile form
  const [name, setName] = useState('')
  const [email] = useState(user?.email || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '')
  const [isSaving, setIsSaving] = useState(false)
  const [nameError, setNameError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Stats
  const [stats, setStats] = useState({ learnedLessons: 0, reviewedCards: 0 })
  const [gamification, setGamification] = useState(null)
  const [rank, setRank] = useState(null)

  // Mini history
  const [historyTab, setHistoryTab] = useState('lessons')
  const [lessonProgress, setLessonProgress] = useState([])
  const [lessonsMap, setLessonsMap] = useState({})
  const [miniBattleHistory, setMiniBattleHistory] = useState([])
  const [miniStreak, setMiniStreak] = useState(0)

  // Modal
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Avatar upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  useEffect(() => {
    loadProfileData()
  }, [])

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  const loadProfileData = async () => {
    setLoading(true)
    setError('')
    const safeGet = async (apiFn, setter, extractor) => {
      try {
        const res = await apiFn()
        if (res?.success && res.data !== undefined) {
          setter(extractor ? extractor(res) : res.data)
        }
      } catch (e) {
        // silent fail
      }
    }

    await Promise.all([
      safeGet(getProfileStats, setStats, (r) => r.data),
      safeGet(getGamificationProfile, setGamification, (r) => r.data),
      safeGet(getMyRank, setRank, (r) => r.data),
      safeGet(getMyStreak, setMiniStreak, (r) => r.data?.currentStreak || 0),
      safeGet(() => getBattleHistory(1, 10), setMiniBattleHistory, (r) => r.data?.items || []),
      (async () => {
        try {
          const res = await getLessons({ page: 1, limit: 5 })
          if (res?.success) {
            const data = res.data?.lessons || []
            // Filter lessons that have any user progress (in_progress or completed)
            const learnedLessons = data.filter((l) => l.userProgress && (l.userProgress.dictation?.status || l.userProgress.shadowing?.status))
            const map = {}
            learnedLessons.forEach((l) => { map[l.lesson._id] = l.lesson })
            setLessonsMap(map)
            // Map lesson with userProgress data
            const lessonsWithData = learnedLessons.map((l) => ({
              ...l.lesson,
              userProgress: l.userProgress,
              lastStudiedAt: l.userProgress.updatedAt || l.userProgress.createdAt
            }))
            setLessonProgress(lessonsWithData)
          }
        } catch (e) {
          // silent fail
        }
      })(),
    ])

    if (user) {
      setName(user.name || '')
      setAvatarUrl(user.avatarUrl || '')
    }
    setLoading(false)
  }

  const handleNameChange = (e) => {
    setName(e.target.value)
    if (nameError) setNameError('')
    if (errorMsg) setErrorMsg('')
    if (successMsg) setSuccessMsg('')
  }

  const validateName = () => {
    if (!name.trim()) {
      setNameError(t('profile.nameRequired'))
      return false
    }
    if (name.trim().length > 50) {
      setNameError(t('profile.nameTooLong'))
      return false
    }
    if (!/^[a-zA-Z0-9\sÀ-ỹ]+$/.test(name)) {
      setNameError(t('profile.nameInvalid'))
      return false
    }
    return true
  }

  const handleSaveProfile = async () => {
    if (!validateName()) return
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await updateProfileApi({ name: name.trim() })
      if (res.success) {
        setSuccessMsg(t('profile.savedSuccess'))
        updateUser({ name: name.trim() })
      } else {
        setErrorMsg(res.message || t('common.error'))
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || t('common.error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg(t('admin.invalidImageFormat') || 'Invalid file format')
      return
    }

    // Validate file content (magic bytes)
    const isValidImage = await validateImageMagicBytes(file)
    if (!isValidImage) {
      setErrorMsg(t('admin.invalidImageFile') || 'Invalid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(t('admin.fileTooLarge') || 'File too large')
      return
    }

    setIsUploadingAvatar(true)
    setErrorMsg('')
    setSuccessMsg('')
    try {
      // Get presigned URL với purpose 'avatar'
      const presignedRes = await getPresignedUrl({
        contentType: file.type,
        purpose: 'avatar',
        fileSize: file.size,
      })

      if (!presignedRes.success || !presignedRes.data?.uploadUrl) {
        throw new Error(presignedRes.message || t('profile.avatarUploadFailed'))
      }

      const { uploadUrl, url } = presignedRes.data

      // Upload file to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadResponse.ok) {
        throw new Error(t('profile.avatarUploadFailed'))
      }

      // Update profile with new avatar URL
      const updateRes = await updateProfileApi({ avatarUrl: url })
      if (updateRes.success) {
        setAvatarUrl(url)
        setSuccessMsg(t('profile.avatarUploadSuccess'))
        updateUser({ avatarUrl: url })
      } else {
        setErrorMsg(updateRes.message || t('profile.avatarUploadFailed'))
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || t('profile.avatarUploadFailed'))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const getInititals = (name) => {
    if (!name) return 'U'
    return name.trim().charAt(0).toUpperCase()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString()
  }

  const getLessonName = (lessonId) => {
    return lessonsMap[lessonId]?.title || lessonId
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-error">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <h1 className="profile-page-title">{t('profile.title')}</h1>

      {successMsg && <div className="profile-alert success">{successMsg}</div>}
      {errorMsg && <div className="profile-alert error">{errorMsg}</div>}

      <div className="profile-grid">
        {/* ========== LEFT COLUMN ========== */}
        <div className="profile-left">
          {/* Profile Card */}
          <div className="profile-card profile-user-card">
            <div className="profile-avatar-wrapper">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.name} className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">{getInititals(user?.name)}</div>
              )}
              <button
                className="profile-avatar-edit-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title={t('profile.changePassword')}
                aria-label="Edit avatar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
                disabled={isUploadingAvatar}
              />
            </div>
            <h2 className="profile-user-name">{user?.name || 'User'}</h2>
            <p className="profile-user-email">{user?.email || ''}</p>
            <button className="profile-change-password-btn" onClick={() => setShowChangePassword(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {t('profile.changePassword')}
            </button>
          </div>

          {/* Info Card */}
          <div className="profile-card">
            <h3 className="profile-card-title">{t('profile.infoCardTitle')}</h3>
            <div className="profile-info-form">
              <Input
                id="profile-name"
                label={t('profile.fullNameLabel')}
                type="text"
                value={name}
                onChange={handleNameChange}
                error={nameError}
                placeholder={user?.name || ''}
              />
              <div className="input-group">
                <label className="input-label">{t('profile.emailLabel')}</label>
                <div
                  style={{
                    opacity: 0.6,
                    cursor: 'not-allowed',
                    padding: '14px 16px',
                    fontSize: '15px',
                    backgroundColor: 'var(--color-surface-container)',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: '10px',
                    fontFamily: 'var(--font-family)',
                    color: 'var(--color-on-surface)',
                    width: '100%',
                  }}
                >
                  {email}
                </div>
              </div>
              <button
                className="profile-save-btn"
                onClick={handleSaveProfile}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? t('profile.saving') : t('profile.saveChanges')}
              </button>
            </div>
          </div>
        </div>

        {/* ========== RIGHT COLUMN ========== */}
        <div className="profile-right">
          {/* Stats Row */}
          <div className="profile-stats-row">
            <div className="profile-stat-card">
              <div className="profile-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <span className="profile-stat-value">{stats.learnedLessons || 0}</span>
              <span className="profile-stat-label">{t('profile.statsLessons')}</span>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <span className="profile-stat-value">{stats.reviewedCards || 0}</span>
              <span className="profile-stat-label">{t('profile.statsCards')}</span>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <span className="profile-stat-value">{miniStreak || 0}</span>
              <span className="profile-stat-label">{t('profile.statsStreak')}</span>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                </svg>
              </div>
              <span className="profile-stat-value">{rank ? `#${rank.rank}` : '-'}</span>
              <span className="profile-stat-label">{t('profile.statsRank')}</span>
            </div>
          </div>

          {/* Level & XP Card */}
          {gamification && (
            <div className="profile-level-card">
              <div className="profile-level-header">
                <div className="profile-level-badge">
                  <div className="profile-level-number">{gamification.level || 1}</div>
                  <div className="profile-level-label">{t('profile.levelLabel', { level: gamification.level || 1 })}</div>
                </div>
                <span className="profile-xp-pct">{t('profile.xpPercent', { pct: gamification.progressPct || 0 })}</span>
              </div>
              <div className="profile-xp-bar-wrapper">
                <div
                  className="profile-xp-bar-fill"
                  style={{ width: `${gamification.progressPct || 0}%` }}
                />
              </div>
              <div className="profile-xp-details">
                <span className="profile-xp-detail">{t('profile.xpProgress', { current: gamification.xpIntoLevel || 0, next: gamification.xpForNextLevel || 100 })}</span>
                <span className="profile-xp-remaining">{t('profile.xpRemaining', { remaining: (gamification.xpForNextLevel || 100) - (gamification.xpIntoLevel || 0) })}</span>
              </div>
            </div>
          )}

          {/* History Card */}
          <div className="profile-history-card">
            <div className="profile-history-header">
              <span className="profile-history-title">{t('profile.historyTitle')}</span>
              <button className="profile-view-all-btn" onClick={() => setShowHistoryModal(true)}>
                {t('profile.viewAll')}
              </button>
            </div>

            {/* Mini History Tabs */}
            <div className="profile-history-tabs">
              <button
                className={`profile-history-tab ${historyTab === 'lessons' ? 'active' : ''}`}
                onClick={() => setHistoryTab('lessons')}
              >
                {t('profile.historyLessons')}
              </button>
              <button
                className={`profile-history-tab ${historyTab === 'battle' ? 'active' : ''}`}
                onClick={() => setHistoryTab('battle')}
              >
                {t('profile.historyBattle')}
              </button>
            </div>

            {/* Mini History Content */}
            <div className="profile-mini-list">
              {historyTab === 'lessons' && (
                lessonProgress.length > 0 ? (
                  <table className="profile-mini-table">
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
                      {lessonProgress.slice(0, 5).map((lesson) => {
                        const dictationPct = lesson.userProgress?.dictation?.progressPct || 0
                        const shadowingPct = lesson.userProgress?.shadowing?.progressPct || 0
                        const dictationStatus = lesson.userProgress?.dictation?.status
                        const shadowingStatus = lesson.userProgress?.shadowing?.status
                        let status = 'not_started'
                        if (dictationStatus === 'completed' && shadowingStatus === 'completed') {
                          status = 'completed'
                        } else if (dictationStatus === 'in_progress' || shadowingStatus === 'in_progress') {
                          status = 'in_progress'
                        }
                        return (
                          <tr key={lesson._id}>
                            <td className="profile-lesson-name">{lesson.title}</td>
                            <td>
                              <div className="profile-progress-container">
                                <div className="profile-progress-bar-bg">
                                  <div className="profile-progress-bar-fill" style={{ width: `${dictationPct}%` }} />
                                </div>
                                <span className="profile-progress-pct">{dictationPct}%</span>
                              </div>
                            </td>
                            <td>
                              <div className="profile-progress-container">
                                <div className="profile-progress-bar-bg">
                                  <div className="profile-progress-bar-fill" style={{ width: `${shadowingPct}%` }} />
                                </div>
                                <span className="profile-progress-pct">{shadowingPct}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`profile-status-badge ${status === 'completed' ? 'completed' : status === 'in_progress' ? 'in_progress' : 'not_started'}`}>
                                {status === 'completed' ? t('profile.completed') : status === 'in_progress' ? t('profile.learning') : t('profile.notStarted')}
                              </span>
                            </td>
                            <td>{formatDate(lesson.lastStudiedAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="profile-mini-empty">{t('profile.noLessonHistory')}</div>
                )
              )}


              {historyTab === 'battle' && (
                miniBattleHistory.length > 0 ? (
                  <table className="profile-mini-table">
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
                      {miniBattleHistory.slice(0, 5).map((match, idx) => {
                        const playerData = match.players?.find(p => p.userId?._id === user?.id)
                        const userScore = playerData?.score ?? 0
                        const userCorrectCount = playerData?.correctCount ?? 0
                        const winnerId = typeof match.winnerId === 'object' ? match.winnerId?._id : match.winnerId
                        const isWinner = winnerId === user?.id
                        const isDraw = match.winnerId === null
                        return (
                          <tr key={match._id || idx}>
                            <td className="profile-mode-name">
                              {match.mode === 'mcq' ? t('battle.modeMcq') : t('battle.modeTyping')}
                            </td>
                            <td>
                              {match.matchType === 'queue' ? t('battle.typeQueue') : t('battle.typeInvite')}
                            </td>
                            <td>
                              <span className={`profile-status-badge ${isDraw ? 'draw' : isWinner ? 'win' : 'lose'}`}>
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
                ) : (
                  <div className="profile-mini-empty">{t('profile.noBattleHistory')}</div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            setShowChangePassword(false)
            setSuccessMsg(t('profile.passwordChangeSuccess'))
          }}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <HistoryModal
          onClose={() => setShowHistoryModal(false)}
          lessonsMap={lessonsMap}
          user={user}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}

export default ProfilePage