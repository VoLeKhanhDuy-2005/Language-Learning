import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getLeaderboardApi, getMyRankApi } from '../gamificationApi'
import Pagination from '../../../components/Pagination/Pagination'
import { useAuth } from '../../../context/AuthContext'
import './LeaderboardPage.css'

const LIMIT = 20

function LeaderboardPage({ onNavigate }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 })
  const [myRank, setMyRank] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLeaderboardData = async (pageNumber) => {
    setLoading(true)
    setError('')
    try {
      const [leaderboardRes, myRankRes] = await Promise.all([
        getLeaderboardApi(pageNumber, LIMIT),
        getMyRankApi()
      ])

      if (leaderboardRes.success) {
        const items = leaderboardRes.data?.items || []
        setLeaderboard(items)

        const total = leaderboardRes.data?.total || 0
        const limit = leaderboardRes.data?.limit || LIMIT
        const totalPages = Math.max(Math.ceil(total / limit), 1)

        setPagination({
          page: leaderboardRes.data?.page || pageNumber,
          totalPages: totalPages,
          totalItems: total
        })
      } else {
        setError(leaderboardRes.message || t('leaderboard.errorLoad'))
      }

      if (myRankRes.success) {
        setMyRank(myRankRes.data)
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu bảng xếp hạng:', err)
      const errorMsg = err.response?.data?.message || err.message || t('leaderboard.errorLoad')
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboardData(1)
  }, [t])

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > pagination.totalPages || pageNumber === pagination.page) return
    fetchLeaderboardData(pageNumber)
  }

  // Tách TOP 3 ra cho giao diện Podium
  // Podium chỉ hiển thị ở trang 1
  const showPodium = pagination.page === 1 && leaderboard.length > 0
  const podiumData = showPodium ? leaderboard.slice(0, 3) : []
  const listData = showPodium ? leaderboard.slice(3) : leaderboard

  // Xếp thứ tự Podium thành: Hạng 2, Hạng 1, Hạng 3
  const firstPlace = podiumData[0] || null
  const secondPlace = podiumData[1] || null
  const thirdPlace = podiumData[2] || null

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.trim().charAt(0).toUpperCase()
  }

  return (
    <div className="leaderboard-container">
      {/* Banner Lỗi */}
      {error && (
        <div className="leaderboard-error-banner">
          <span>{error}</span>
          <button className="leaderboard-error-close" onClick={() => setError('')} aria-label="Close error">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="leaderboard-header-row">
        <div className="leaderboard-title-group">
          <h1 className="leaderboard-title">{t('leaderboard.title')}</h1>
          <p className="leaderboard-subtitle">{t('leaderboard.subtitle')}</p>
        </div>

        {/* User's current rank card */}
        {!loading && myRank && (
          <div className="my-rank-card">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="my-rank-avatar" />
            ) : (
              <div className="my-rank-avatar-placeholder">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="my-rank-info">
              <span className="my-rank-title">{t('leaderboard.yourRankCard')}</span>
              <span className="my-rank-value">
                {myRank.rank > 0 ? t('leaderboard.yourRankLabel', { rank: myRank.rank }) : '—'}
              </span>
              <span className="my-rank-xp">
                {t('leaderboard.yourXp', { xp: (myRank.totalXp || 0).toLocaleString() })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="leaderboard-loading-container">
          <div className="leaderboard-spinner"></div>
          <p className="leaderboard-loading-text">{t('leaderboard.loading')}</p>
        </div>
      ) : leaderboard.length === 0 ? (
        // Empty state
        <div className="leaderboard-empty-container">
          <p className="leaderboard-empty-text">{t('leaderboard.empty')}</p>
        </div>
      ) : (
        <>
          {/* TOP 3 Podium */}
          {showPodium && (
            <div className="leaderboard-podium">
              {/* Hạng 1 */}
              {firstPlace && (
                <div className="podium-item rank-1">
                  <div className="podium-avatar-wrapper">
                    {firstPlace.avatarUrl ? (
                      <img src={firstPlace.avatarUrl} alt={firstPlace.name} className="podium-avatar" />
                    ) : (
                      <div className="podium-avatar-placeholder">
                        {getInitials(firstPlace.name)}
                      </div>
                    )}
                    <span className="podium-badge">1</span>
                  </div>
                  <div className="podium-card">
                    <div className="podium-info-wrapper">
                      <span className="podium-name">{firstPlace.name || t('leaderboard.anonymousUser')}</span>
                      <span className="podium-level">{t('leaderboard.currentLevel', { level: firstPlace.level || 1 })}</span>
                    </div>
                    <div className="podium-xp-wrapper">
                      <span className="podium-xp">{firstPlace.totalXp?.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Hạng 2 */}
              {secondPlace && (
                <div className="podium-item rank-2">
                  <div className="podium-avatar-wrapper">
                    {secondPlace.avatarUrl ? (
                      <img src={secondPlace.avatarUrl} alt={secondPlace.name} className="podium-avatar" />
                    ) : (
                      <div className="podium-avatar-placeholder">
                        {getInitials(secondPlace.name)}
                      </div>
                    )}
                    <span className="podium-badge">2</span>
                  </div>
                  <div className="podium-card">
                    <div className="podium-info-wrapper">
                      <span className="podium-name">{secondPlace.name || t('leaderboard.anonymousUser')}</span>
                      <span className="podium-level">{t('leaderboard.currentLevel', { level: secondPlace.level || 1 })}</span>
                    </div>
                    <div className="podium-xp-wrapper">
                      <span className="podium-xp">{secondPlace.totalXp?.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Hạng 3 */}
              {thirdPlace && (
                <div className="podium-item rank-3">
                  <div className="podium-avatar-wrapper">
                    {thirdPlace.avatarUrl ? (
                      <img src={thirdPlace.avatarUrl} alt={thirdPlace.name} className="podium-avatar" />
                    ) : (
                      <div className="podium-avatar-placeholder">
                        {getInitials(thirdPlace.name)}
                      </div>
                    )}
                    <span className="podium-badge">3</span>
                  </div>
                  <div className="podium-card">
                    <div className="podium-info-wrapper">
                      <span className="podium-name">{thirdPlace.name || t('leaderboard.anonymousUser')}</span>
                      <span className="podium-level">{t('leaderboard.currentLevel', { level: thirdPlace.level || 1 })}</span>
                    </div>
                    <div className="podium-xp-wrapper">
                      <span className="podium-xp">{thirdPlace.totalXp?.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List/Table */}
          <div className="leaderboard-table-section">
            <div className="leaderboard-table-header">
              <h3 className="leaderboard-table-subtitle">{t('leaderboard.rankingSubtitle')}</h3>
            </div>
            <div className="leaderboard-list">
              {listData.map((item, index) => {
                const actualRank = showPodium ? index + 4 : (pagination.page - 1) * LIMIT + index + 1
                const isCurrentUser = myRank && myRank.userId === item.userId

                return (
                  <div key={item.userId} className={`leaderboard-row ${isCurrentUser ? 'highlighted' : ''}`}>
                    <div className="leaderboard-cell-rank">
                      <span>#{actualRank}</span>
                    </div>
                    <div className="leaderboard-cell-user">
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt={item.name} className="leaderboard-row-avatar" />
                      ) : (
                        <div className="leaderboard-row-avatar-placeholder">
                          {getInitials(item.name)}
                        </div>
                      )}
                      <span className="leaderboard-row-name">{item.name || t('leaderboard.anonymousUser')}</span>
                    </div>
                    <div className="leaderboard-cell-level">
                      <span>{t('leaderboard.currentLevel', { level: item.level || 1 })}</span>
                    </div>
                    <div className="leaderboard-cell-xp">
                      <span>{item.totalXp?.toLocaleString()} XP</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}

export default LeaderboardPage
