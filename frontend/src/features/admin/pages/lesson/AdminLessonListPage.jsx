import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  listAdminLessonsApi,
  listCefrLevelsApi,
  listTagsApi,
  updateAdminLessonApi
} from '../../adminApi'
import './AdminLessonListPage.css'

const LIMIT = 8

function AdminLessonListPage({ onNavigate }) {
  const { t, i18n } = useTranslation()
  const [lessons, setLessons] = useState([])
  const [cefrLevels, setCefrLevels] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 })
  const [filters, setFilters] = useState({ q: '', cefrLevelId: '', tagId: '', status: '' })
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [cefrRes, tagRes] = await Promise.all([
          listCefrLevelsApi(),
          listTagsApi()
        ])
        if (cefrRes.data) setCefrLevels(cefrRes.data)
        if (tagRes.data) setTags(tagRes.data)
      } catch {
        // The list can still render without metadata filters.
      }
    }
    loadMeta()
  }, [])

  const fetchLessons = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await listAdminLessonsApi({ ...filters, page, limit: LIMIT })
      if (res.data) {
        setLessons(res.data.lessons || [])
        setPagination(res.data.pagination || { page: 1, totalPages: 1, totalItems: 0 })
      } else {
        setError(t('admin.lessonFetchError'))
      }
    } catch {
      setError(t('admin.lessonFetchError'))
    } finally {
      setLoading(false)
    }
  }, [filters, t])

  useEffect(() => {
    fetchLessons(1)
  }, [fetchLessons])

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchInput }))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const cefrMap = useMemo(() => {
    return new Map(cefrLevels.map((level) => [level._id, level.label || level.code]))
  }, [cefrLevels])

  const tagMap = useMemo(() => {
    return new Map(tags.map((tag) => [tag._id, tag.label || tag.code]))
  }, [tags])

  const getLabels = (items = [], fallbackMap) => {
    return items.map((item) => {
      if (item?.label || item?.code) return item.label || item.code
      return fallbackMap.get(item)
    }).filter(Boolean)
  }

  const getStatusLabel = (status) => {
    if (status === 'published') return t('admin.statusPublished')
    if (status === 'archived') return t('admin.statusArchived')
    return t('admin.statusDraft')
  }

  const getModeLabel = (mode) => {
    if (mode === 'dictation') return 'Dictation'
    if (mode === 'shadowing') return 'Shadowing'
    return mode
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setFilters({ q: '', cefrLevelId: '', tagId: '', status: '' })
  }

  const handleArchiveToggle = async (lesson) => {
    const newStatus = lesson.status === 'archived'
      ? (lesson.publishedAt ? 'published' : 'draft')
      : 'archived'
    setActionLoadingId(lesson._id)
    try {
      await updateAdminLessonApi(lesson._id, { ...lesson, status: newStatus, title: lesson.title })
      fetchLessons(pagination.page)
    } catch {
      setError(t('admin.lessonActionError'))
    } finally {
      setActionLoadingId('')
    }
  }

  const from = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * LIMIT + 1
  const to = Math.min(pagination.page * LIMIT, pagination.totalItems)

  return (
    <div className="admin-lesson-list-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t('admin.lessonListTitle')}</h1>
          <p className="admin-page-subtitle">{t('admin.lessonListSubtitle')}</p>
        </div>
        <button
          className="admin-create-btn"
          onClick={() => onNavigate && onNavigate('/admin/lessons/new')}
        >
          {t('admin.createLessonBtn')}
        </button>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search-wrap">
          <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder={t('admin.lessonSearchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <select
          className="admin-filter-select"
          value={filters.cefrLevelId}
          onChange={(e) => setFilters((prev) => ({ ...prev, cefrLevelId: e.target.value }))}
        >
          <option value="">{t('admin.filterCefr')}</option>
          {cefrLevels.map((level) => (
            <option key={level._id} value={level._id}>{level.label || level.code}</option>
          ))}
        </select>

        <select
          className="admin-filter-select"
          value={filters.tagId}
          onChange={(e) => setFilters((prev) => ({ ...prev, tagId: e.target.value }))}
        >
          <option value="">{t('admin.filterTag')}</option>
          {tags.map((tag) => (
            <option key={tag._id} value={tag._id}>{tag.label || tag.code}</option>
          ))}
        </select>

        <select
          className="admin-filter-select"
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
        >
          <option value="">{t('admin.filterStatus')}</option>
          <option value="published">{t('admin.statusPublished')}</option>
          <option value="draft">{t('admin.statusDraft')}</option>
          <option value="archived">{t('admin.statusArchived')}</option>
        </select>

        <button className="admin-clear-filter-btn" onClick={handleClearFilters}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {t('admin.clearFilter')}
        </button>
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      {loading ? (
        <div className="admin-loading">
          <div className="admin-loading-spinner" />
          <span>{t('admin.loading')}</span>
        </div>
      ) : lessons.length === 0 ? (
        <div className="admin-lesson-empty-state">
          <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <p>{t('api.error.LESSON_NOT_FOUND')}</p>
        </div>
      ) : (
        <div className="admin-lesson-table-card">
          <div className="admin-lesson-table-scroll">
            <table className="admin-lesson-table">
              <thead>
                <tr>
                  <th>{t('admin.lessonInfoHeader')}</th>
                  <th>{t('admin.cefrLabel')}</th>
                  <th>{t('admin.lessonTagLabel')}</th>
                  <th>{t('admin.modeHeader')}</th>
                  <th>{t('admin.statusLabel')}</th>
                  <th>{t('admin.updatedHeader')}</th>
                  <th className="admin-lesson-actions-head">{t('admin.tableHeaderActions')}</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => {
                  const cefrLabels = getLabels(lesson.cefrLevelIds, cefrMap)
                  const tagLabels = getLabels(lesson.tagIds, tagMap)
                  const modes = lesson.modes || []
                  const isBusy = actionLoadingId === lesson._id

                  return (
                    <tr key={lesson._id} className={lesson.status === 'archived' ? 'archived' : ''}>
                      <td>
                        <div className="admin-lesson-info">
                          <div className="admin-lesson-thumb">
                            {lesson.thumbnailUrl ? (
                              <img src={lesson.thumbnailUrl} alt={lesson.title} />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M15 10l4.55-2.27A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.89L15 14" />
                                <rect x="3" y="6" width="12" height="12" rx="2" />
                              </svg>
                            )}
                          </div>
                          <div className="admin-lesson-copy">
                            <strong>{lesson.title}</strong>
                            <span>{lesson.description || t('admin.noDescription')}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-lesson-badge-list">
                          {cefrLabels.length > 0 ? cefrLabels.map((label) => (
                            <span key={label} className="admin-lesson-badge cefr">{label}</span>
                          )) : <span className="admin-muted-cell">-</span>}
                        </div>
                      </td>
                      <td>
                        <div className="admin-lesson-badge-list">
                          {tagLabels.length > 0 ? tagLabels.map((label) => (
                            <span key={label} className="admin-lesson-badge tag">{label}</span>
                          )) : <span className="admin-muted-cell">-</span>}
                        </div>
                      </td>
                      <td>
                        <div className="admin-lesson-badge-list">
                          {modes.length > 0 ? modes.map((mode) => (
                            <span key={mode} className="admin-lesson-badge mode">{getModeLabel(mode)}</span>
                          )) : <span className="admin-muted-cell">-</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-lesson-status ${lesson.status || 'draft'}`}>
                          <span className="status-dot" />
                          {getStatusLabel(lesson.status)}
                        </span>
                      </td>
                      <td>
                        <span className="admin-lesson-date">{formatDate(lesson.updatedAt || lesson.publishedAt || lesson.createdAt)}</span>
                      </td>
                      <td>
                        <div className="admin-lesson-actions">
                          <button
                            type="button"
                            className="admin-lesson-icon-btn"
                            title={t('admin.editLesson')}
                            onClick={() => onNavigate && onNavigate(`/admin/lessons/${lesson._id}/edit`)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {lesson.status !== 'draft' && (
                            <button
                              type="button"
                              className={`admin-lesson-icon-btn ${lesson.status === 'archived' ? 'unarchive' : 'danger'}`}
                              title={lesson.status === 'archived' ? t('admin.unarchive') : t('admin.archive')}
                              disabled={isBusy}
                              onClick={() => handleArchiveToggle(lesson)}
                            >
                              {lesson.status === 'archived' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="21 8 21 21 3 21 3 8" />
                                  <rect x="1" y="3" width="22" height="5" rx="1" />
                                  <line x1="10" y1="12" x2="14" y2="12" />
                                  <polyline points="10 16 12 12 14 16" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="21 8 21 21 3 21 3 8" />
                                  <rect x="1" y="3" width="22" height="5" rx="1" />
                                  <line x1="10" y1="12" x2="14" y2="12" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && pagination.totalItems > 0 && (
        <div className="admin-pagination">
          <span className="admin-pagination-info">
            {t('admin.lessonPagination', { from, to, total: pagination.totalItems })}
          </span>
          <div className="admin-pagination-controls">
            <button
              className="admin-pagination-btn"
              disabled={pagination.page <= 1}
              onClick={() => fetchLessons(pagination.page - 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`admin-pagination-btn ${page === pagination.page ? 'active' : ''}`}
                onClick={() => fetchLessons(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="admin-pagination-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLessons(pagination.page + 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminLessonListPage
