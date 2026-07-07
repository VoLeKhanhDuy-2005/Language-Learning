import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminDashboardApi } from '../../adminApi'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import './AdminDashboardPage.css'

function AdminDashboardPage({ onNavigate }) {
  const { t } = useTranslation()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartRange, setChartRange] = useState('6')

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getAdminDashboardApi()
        if (res.data) {
          setMetrics(res.data)
        } else {
          setError(t('admin.dashboardFetchError'))
        }
      } catch {
        setError(t('admin.dashboardFetchError'))
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [t])

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <span>{t('admin.dashboardLoading')}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-error-message">{error}</div>
      </div>
    )
  }

  if (!metrics) return null

  // Pick chart dataset based on dropdown selection
  const chartData = chartRange === '12'
    ? (metrics.userRegistrationChart12Months || [])
    : (metrics.userRegistrationChart6Months || [])
  const totalRegistrations = chartData.reduce((sum, item) => sum + item.count, 0)

  const statCards = [
    {
      key: 'totalUsers',
      label: t('admin.dashTotalUsers'),
      value: metrics.totalUsers ?? 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: 'activeUsers',
      label: t('admin.dashActiveUsers'),
      value: metrics.activeUsers ?? 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
    {
      key: 'totalLessons',
      label: t('admin.dashTotalLessons'),
      value: metrics.totalLessons ?? 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      key: 'totalDecks',
      label: t('admin.dashTotalDecks'),
      value: metrics.totalDecks ?? 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      ),
    },
  ]

  const formatCount = (val) => {
    if (!val && val !== 0) return 0
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`
    return val.toLocaleString()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Merge recent lessons and decks into a single activity list
  const recentActivity = [
    ...(metrics.recentContent?.lessons || []).map((item) => ({
      _id: item._id,
      type: 'lesson',
      title: item.title,
      status: item.status || 'draft',
      createdAt: item.createdAt,
      author: '—',
    })),
    ...(metrics.recentContent?.decks || []).map((item) => ({
      _id: item._id,
      type: 'deck',
      title: item.title,
      status: item.status || 'draft',
      createdAt: item.createdAt,
      author: '—',
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  const cefrLabels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

  return (
    <div className="admin-dashboard-page">
      {/* ── Section 1: Statistics Cards ── */}
      <div className="admin-dash-section">
        <div className="admin-dash-stat-grid">
          {statCards.map((card) => (
            <div key={card.key} className="admin-dash-stat-card">
              <div className="admin-dash-stat-icon-wrap">
                {card.icon}
              </div>
              <div className="admin-dash-stat-body">
                <span className="admin-dash-stat-label">{card.label}</span>
              <div className="admin-dash-stat-bottom">
                  <span className="admin-dash-stat-value">{formatCount(card.value)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Registration Analytics ── */}
      <div className="admin-dash-section">
        <div className="admin-dash-analytics-card">
          <div className="admin-dash-analytics-header">
            <div>
              <h2 className="admin-dash-section-title">{t('admin.dashRegistrationChart')}</h2>
              <p className="admin-dash-section-desc">
                {t('admin.dashAnalyticsDesc', { total: formatCount(totalRegistrations) })}
              </p>
            </div>
            <select
              className="admin-dash-range-select"
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value)}
            >
              <option value="6">{t('admin.dashLast6Months')}</option>
              <option value="12">{t('admin.dashLast12Months')}</option>
            </select>
          </div>
          <div className="admin-dash-chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-family)' }}
                    axisLine={{ stroke: 'var(--color-outline-variant)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-family)' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-container-lowest)',
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: 'var(--rounded-md)',
                      fontFamily: 'var(--font-family)',
                      fontSize: 13,
                      color: 'var(--color-on-surface)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fill="url(#areaGradient)"
                    dot={{ r: 3, fill: 'var(--color-primary)', stroke: 'var(--color-surface-container-lowest)', strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: 'var(--color-primary)', stroke: 'var(--color-surface-container-lowest)', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="admin-dash-chart-empty">{t('admin.dashNoChartData')}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Popular Content ── */}
      <div className="admin-dash-section">
        <div className="admin-dash-popular-row">
          {/* Popular Lessons */}
          <div className="admin-dash-popular-card">
            <div className="admin-dash-popular-card-header">
              <h2 className="admin-dash-section-title">{t('admin.dashPopularLessons')}</h2>
              {metrics.popularLessons?.length > 0 && (
                <button
                  className="admin-dash-view-all"
                  onClick={() => onNavigate && onNavigate('/admin/lessons')}
                >
                  {t('admin.dashViewAll')}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>
            <div className="admin-dash-popular-list">
              {metrics.popularLessons && metrics.popularLessons.length > 0 ? (
                metrics.popularLessons.map((item, idx) => (
                  <button
                    key={item._id}
                    className="admin-dash-popular-item"
                    onClick={() => onNavigate && onNavigate(`/admin/lessons/${item._id}/edit`)}
                  >
                    <div className="admin-dash-popular-rank">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="admin-dash-popular-info">
                      <span className="admin-dash-popular-name">{item.title}</span>
                      <span className="admin-dash-popular-count">
                        {item.userCount} {t('admin.dashLearners')}
                      </span>
                    </div>
                    <svg className="admin-dash-popular-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))
              ) : (
                <div className="admin-dash-popular-empty">{t('admin.dashNoPopularData')}</div>
              )}
            </div>
          </div>

          {/* Popular Decks */}
          <div className="admin-dash-popular-card">
            <div className="admin-dash-popular-card-header">
              <h2 className="admin-dash-section-title">{t('admin.dashPopularDecks')}</h2>
              {metrics.popularDecks?.length > 0 && (
                <button
                  className="admin-dash-view-all"
                  onClick={() => onNavigate && onNavigate('/admin/decks')}
                >
                  {t('admin.dashViewAll')}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>
            <div className="admin-dash-popular-list">
              {metrics.popularDecks && metrics.popularDecks.length > 0 ? (
                metrics.popularDecks.map((item, idx) => (
                  <button
                    key={item._id}
                    className="admin-dash-popular-item"
                    onClick={() => onNavigate && onNavigate(`/admin/decks/${item._id}`)}
                  >
                    <div className="admin-dash-popular-thumb">
                      {item.coverImage ? (
                        <img src={item.coverImage} alt={item.title} />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                          <rect x="2" y="7" width="20" height="14" rx="2" />
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                        </svg>
                      )}
                    </div>
                    <div className="admin-dash-popular-info">
                      <span className="admin-dash-popular-name">{item.title}</span>
                      <span className="admin-dash-popular-count">
                        {item.cardCount || 0} {t('admin.cards')}
                      </span>
                    </div>
                    <svg className="admin-dash-popular-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))
              ) : (
                <div className="admin-dash-popular-empty">{t('admin.dashNoPopularData')}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Recent Activity Table ── */}
      <div className="admin-dash-section">
        <div className="admin-dash-table-card">
          <div className="admin-dash-table-header">
            <h2 className="admin-dash-section-title">{t('admin.dashRecentContent')}</h2>
            <div className="admin-dash-table-actions">
              <button
                className="admin-dash-action-btn"
                onClick={() => onNavigate && onNavigate('/admin/lessons/new')}
              >
                {t('admin.createLessonBtn')}
              </button>
              <button
                className="admin-dash-action-btn admin-dash-action-btn-secondary"
                onClick={() => onNavigate && onNavigate('/admin/decks/new')}
              >
                {t('admin.createDeckBtn')}
              </button>
            </div>
          </div>

          {recentActivity.length > 0 ? (
            <>
              <div className="admin-dash-table-wrap">
                <table className="admin-dash-table">
                  <colgroup>
                    <col className="col-type" />
                    <col className="col-title" />
                    <col className="col-author" />
                    <col className="col-date" />
                    <col className="col-status" />
                    <col className="col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>{t('admin.dashTableType')}</th>
                      <th>{t('admin.dashTableTitle')}</th>
                      <th>{t('admin.dashTableAuthor')}</th>
                      <th>{t('admin.dashTableDate')}</th>
                      <th>{t('admin.dashTableStatus')}</th>
                      <th>{t('admin.dashTableActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <span className={`admin-dash-type-badge ${item.type}`}>
                            {item.type === 'lesson' ? t('admin.dashTypeLesson') : t('admin.dashTypeDeck')}
                          </span>
                        </td>
                        <td className="admin-dash-table-title-cell">{item.title}</td>
                        <td className="admin-dash-table-muted">{item.author}</td>
                        <td className="admin-dash-table-muted">{formatDate(item.createdAt)}</td>
                        <td>
                          <span className={`admin-status-pill ${item.status}`}>
                            {item.status === 'published' ? t('admin.statusPublished') : item.status === 'draft' ? t('admin.statusDraft') : t('admin.archived')}
                          </span>
                        </td>
                        <td>
                          <button
                            className="admin-dash-table-action-btn"
                            title={t('admin.editLesson')}
                            onClick={() => {
                              const path = item.type === 'lesson'
                                ? `/admin/lessons/${item._id}/edit`
                                : `/admin/decks/${item._id}`
                              onNavigate && onNavigate(path)
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="admin-dash-popular-empty">{t('admin.dashNoRecentData')}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage