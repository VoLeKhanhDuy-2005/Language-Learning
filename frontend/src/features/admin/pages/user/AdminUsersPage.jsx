import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listAdminUsersApi, getAdminDashboardApi, changeAdminUserStatusApi, changeAdminUserPasswordApi } from '../../adminApi'
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal'
import Input from '../../../../components/Input/Input'
import './AdminUsersPage.css'

const LIMIT = 10

function AdminUsersPage({ onNavigate }) {
  const { t } = useTranslation()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 })

  const [filters, setFilters] = useState({ q: '', status: '' })
  const [searchInput, setSearchInput] = useState('')

  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, bannedUsers: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  // Modals
  const [banModalOpen, setBanModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [banReason, setBanReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null) // 'lock' or 'unlock'
  const [confirmUser, setConfirmUser] = useState(null)

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true)
      try {
        const [dashboardRes, bannedRes] = await Promise.all([
          getAdminDashboardApi(),
          listAdminUsersApi({ status: 'banned', limit: 1 })
        ])
        
        let totalUsers = 0
        let activeUsers = 0
        if (dashboardRes.data) {
          totalUsers = dashboardRes.data.totalUsers || 0
          activeUsers = dashboardRes.data.activeUsers || 0
        }
        
        let bannedUsers = 0
        if (bannedRes.data && bannedRes.data.pagination) {
          bannedUsers = bannedRes.data.pagination.totalItems || 0
        }
        
        setStats({ totalUsers, activeUsers, bannedUsers })
      } catch {
        setStats({ totalUsers: 0, activeUsers: 0, bannedUsers: 0 })
      } finally {
        setLoadingStats(false)
      }
    }
    loadStats()
  }, [])

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await listAdminUsersApi({ ...filters, page, limit: LIMIT })
      if (res.data) {
        setUsers(res.data.users || [])
        setPagination(res.data.pagination || { page: 1, totalPages: 1, totalItems: 0 })
      } else {
        setError(t('admin.userFetchError'))
      }
    } catch {
      setError(t('admin.userFetchError'))
    } finally {
      setLoading(false)
    }
  }, [filters, t])

  useEffect(() => {
    fetchUsers(1)
  }, [fetchUsers])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchInput }))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleClearFilters = () => {
    setSearchInput('')
    setFilters({ q: '', status: '' })
  }

  const handleLockClick = (user) => {
    setSelectedUser(user)
    setBanReason('')
    setBanModalOpen(true)
  }

  const handleUnlockClick = (user) => {
    setConfirmUser(user)
    setConfirmAction('unlock')
    setConfirmModalOpen(true)
  }
  
  const handleConfirmUnlock = async () => {
    if (!confirmUser) return
    try {
      const res = await changeAdminUserStatusApi(confirmUser._id, 'active', '')
      if (res.data && res.data.code) {
        setSuccessMsg(t(`api.success.${res.data.code}`))
      } else {
        setSuccessMsg(t('api.success.USER_STATUS_UPDATED_SUCCESS'))
      }
      setConfirmModalOpen(false)
      setConfirmUser(null)
      fetchUsers(pagination.page)
      // Reload stats
      setLoadingStats(true)
      const [dashboardRes, bannedRes] = await Promise.all([
        getAdminDashboardApi(),
        listAdminUsersApi({ status: 'banned', limit: 1 })
      ])
      let totalUsers = dashboardRes.data?.totalUsers || 0
      let activeUsers = dashboardRes.data?.activeUsers || 0
      let bannedUsers = bannedRes.data?.pagination?.totalItems || 0
      setStats({ totalUsers, activeUsers, bannedUsers })
      setLoadingStats(false)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('api.error.USER_NOT_FOUND')
      setError(errorMsg)
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleBanSubmit = async () => {
    if (!selectedUser || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await changeAdminUserStatusApi(selectedUser._id, 'banned', banReason)
      if (res.data && res.data.code) {
        setSuccessMsg(t(`api.success.${res.data.code}`))
      } else {
        setSuccessMsg(t('api.success.USER_STATUS_UPDATED_SUCCESS'))
      }
      setBanModalOpen(false)
      setSelectedUser(null)
      setBanReason('')
      fetchUsers(pagination.page)
      // Reload stats
      setLoadingStats(true)
      const [dashboardRes, bannedRes] = await Promise.all([
        getAdminDashboardApi(),
        listAdminUsersApi({ status: 'banned', limit: 1 })
      ])
      let totalUsers = dashboardRes.data?.totalUsers || 0
      let activeUsers = dashboardRes.data?.activeUsers || 0
      let bannedUsers = bannedRes.data?.pagination?.totalItems || 0
      setStats({ totalUsers, activeUsers, bannedUsers })
      setLoadingStats(false)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('api.error.USER_NOT_FOUND')
      setError(errorMsg)
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordClick = (user) => {
    setSelectedUser(user)
    setNewPassword('')
    setPasswordError('')
    setPasswordModalOpen(true)
  }
  
  const handlePasswordSubmit = async () => {
    if (!selectedUser || !newPassword.trim() || isSubmittingPassword) return
    
    // Validate password length
    if (newPassword.trim().length < 6) {
      setPasswordError(t('admin.passwordTooShort'))
      return
    }
    
    setIsSubmittingPassword(true)
    setPasswordError('')
    try {
      const res = await changeAdminUserPasswordApi(selectedUser._id, newPassword.trim())
      if (res.data && res.data.code) {
        setSuccessMsg(t(`api.success.${res.data.code}`))
      } else {
        setSuccessMsg(t('api.success.USER_PASSWORD_CHANGED_SUCCESS'))
      }
      setPasswordModalOpen(false)
      setSelectedUser(null)
      setNewPassword('')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('api.error.USER_NOT_FOUND')
      setError(errorMsg)
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getUserStatus = (user) => {
    if (!user.isActive) return 'banned'
    if (!user.isVerified) return 'unverified'
    return 'active'
  }

  const from = (pagination.page - 1) * LIMIT + 1
  const to = Math.min(pagination.page * LIMIT, pagination.totalItems)

  return (
    <div className="admin-users-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t('admin.userListTitle')}</h1>
          <p className="admin-page-subtitle">{t('admin.userListSubtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-users-stats">
        <div className="admin-users-stat-card">
          <div className="admin-users-stat-label">{t('admin.dashTotalUsers')}</div>
          <div className="admin-users-stat-value">{loadingStats ? '...' : stats.totalUsers.toLocaleString()}</div>
        </div>
        <div className="admin-users-stat-card">
          <div className="admin-users-stat-label">{t('admin.dashActiveUsers')}</div>
          <div className="admin-users-stat-value">{loadingStats ? '...' : stats.activeUsers.toLocaleString()}</div>
        </div>
        <div className="admin-users-stat-card">
          <div className="admin-users-stat-label">{t('admin.userStatusBanned')}</div>
          <div className="admin-users-stat-value">{loadingStats ? '...' : stats.bannedUsers.toLocaleString()}</div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-wrap">
          <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder={t('admin.userSearchPlaceholder') || 'Tìm kiếm người dùng...'}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <select
          className="admin-filter-select"
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
        >
          <option value="">{t('admin.filterStatusAll')}</option>
          <option value="active">{t('admin.filterStatusActive')}</option>
          <option value="unverified">{t('admin.filterStatusUnverified')}</option>
          <option value="banned">{t('admin.filterStatusBanned')}</option>
        </select>

        <button className="admin-clear-filter-btn" onClick={handleClearFilters}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {t('admin.clearFilter')}
        </button>
      </div>

      {/* Error */}
      {error && <div className="admin-error-message">{error}</div>}

      {/* Loading */}
      {loading && (
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <span>{t('admin.loading')}</span>
        </div>
      )}

      {/* User Table */}
      {!loading && (
        <div className="admin-users-table-container">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>{t('admin.userTableName')}</th>
                <th>{t('admin.userTableEmail')}</th>
                <th>{t('admin.userTableStatus')}</th>
                <th>{t('admin.userTableJoinDate')}</th>
                <th className="admin-users-actions-header">{t('admin.userTableActions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const status = getUserStatus(user)
                return (
                  <tr key={user._id} className={status === 'banned' ? 'banned-row' : ''}>
                    <td className="admin-users-name-cell">
                      <div className="admin-user-info">
                        <div className="admin-user-avatar">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} />
                          ) : (
                            <div className="admin-user-avatar-placeholder">
                              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="admin-user-name">{user.name || '—'}</span>
                      </div>
                    </td>
                    <td className="admin-users-email-cell">{user.email}</td>
                    <td>
                      <span className={`admin-status-pill ${status}`}>
                        {status === 'active' && t('admin.userStatusActive')}
                        {status === 'unverified' && t('admin.userStatusUnverified')}
                        {status === 'banned' && t('admin.userStatusBanned')}
                      </span>
                    </td>
                    <td className="admin-users-date-cell">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="admin-users-actions">
                        <button
                          className="admin-users-action-btn password"
                          title={t('admin.changePassword')}
                          onClick={() => handlePasswordClick(user)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                          </svg>
                        </button>
                        {status === 'banned' ? (
                          <button
                            className="admin-users-action-btn unlock"
                            title={t('admin.unlockUser')}
                            onClick={() => handleUnlockClick(user)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            className="admin-users-action-btn lock"
                            title={t('admin.lockUser')}
                            onClick={() => handleLockClick(user)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-users-empty">
                    {t('api.error.USER_NOT_FOUND')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalItems > 0 && (
        <div className="admin-pagination">
          <span className="admin-pagination-info">
            {t('admin.userPagination', { from, to, total: pagination.totalItems })}
          </span>
          <div className="admin-pagination-controls">
            <button
              className="admin-pagination-btn"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`admin-pagination-btn ${p === pagination.page ? 'active' : ''}`}
                onClick={() => fetchUsers(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="admin-pagination-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModalOpen && (
        <div className="admin-ban-modal-overlay" onClick={() => setBanModalOpen(false)}>
          <div className="admin-ban-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-ban-modal-header">
              <h3 className="admin-ban-modal-title">{t('admin.banUserTitle')}</h3>
              <button className="admin-ban-modal-close" onClick={() => setBanModalOpen(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-ban-modal-body">
              <textarea
                className="admin-ban-modal-textarea"
                placeholder={t('admin.banUserPlaceholder')}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="admin-ban-modal-footer">
              <button className="admin-ban-modal-cancel" onClick={() => setBanModalOpen(false)}>
                {t('admin.cancelBtn')}
              </button>
              <button
                className="admin-ban-modal-confirm"
                onClick={handleBanSubmit}
                disabled={isSubmitting || !banReason.trim()}
              >
                {isSubmitting ? (
                  <div className="admin-ban-modal-spinner" />
                ) : (
                  t('admin.banUserConfirm')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Password Modal */}
      {passwordModalOpen && (
        <div className="admin-ban-modal-overlay" onClick={() => setPasswordModalOpen(false)}>
          <div className="admin-ban-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-ban-modal-header">
              <h3 className="admin-ban-modal-title">{t('admin.changePasswordTitle')}</h3>
              <button className="admin-ban-modal-close" onClick={() => setPasswordModalOpen(false)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-ban-modal-body">
              <Input
                type="password"
                placeholder={t('admin.changePasswordPlaceholder')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={passwordError}
              />
            </div>
            <div className="admin-ban-modal-footer">
              <button className="admin-ban-modal-cancel" onClick={() => setPasswordModalOpen(false)}>
                {t('admin.cancelBtn')}
              </button>
              <button
                className="admin-ban-modal-confirm"
                onClick={handlePasswordSubmit}
                disabled={isSubmittingPassword || !newPassword.trim()}
              >
                {isSubmittingPassword ? (
                  <div className="admin-ban-modal-spinner" />
                ) : (
                  t('admin.changePasswordConfirm')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title={confirmAction === 'unlock' ? t('admin.confirmUnlockUserTitle') : t('admin.confirmLockUserTitle')}
        message={confirmAction === 'unlock' ? t('admin.confirmUnlockUser') : t('admin.confirmLockUser')}
        confirmText={confirmAction === 'unlock' ? t('admin.unlockUser') : t('admin.lockUser')}
        cancelText={t('admin.cancelBtn')}
        onConfirm={confirmAction === 'unlock' ? handleConfirmUnlock : () => {}}
        onCancel={() => {
          setConfirmModalOpen(false)
          setConfirmUser(null)
          setConfirmAction(null)
        }}
        isDanger={true}
      />
    </div>
  )
}

export default AdminUsersPage
