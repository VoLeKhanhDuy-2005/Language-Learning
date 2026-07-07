import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { listAdminDecksApi, deleteAdminDeckApi, updateAdminDeckApi, listCefrLevelsApi, listTagsApi } from '../../adminApi'
import './AdminDeckListPage.css'

const LIMIT = 8

function AdminDeckListPage({ onNavigate }) {
  const { t } = useTranslation()

  const [decks, setDecks] = useState([])
  const [cefrLevels, setCefrLevels] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 })

  const [filters, setFilters] = useState({ q: '', cefrLevelId: '', tagId: '', status: '' })
  const [searchInput, setSearchInput] = useState('')

  // Load metadata once
  useEffect(() => {
    const loadMeta = async () => {
      const [cefrRes, tagRes] = await Promise.all([listCefrLevelsApi(), listTagsApi()])
      if (cefrRes.data) setCefrLevels(cefrRes.data)
      if (tagRes.data) setTags(tagRes.data)
    }
    loadMeta()
  }, [])

  const fetchDecks = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await listAdminDecksApi({ ...filters, page, limit: LIMIT })
      if (res.data) {
        setDecks(res.data.decks || [])
        setPagination(res.data.pagination || { page: 1, totalPages: 1, totalItems: 0 })
      } else {
        setError(t('admin.fetchError'))
      }
    } catch {
      setError(t('admin.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [filters, t])

  useEffect(() => {
    fetchDecks(1)
  }, [fetchDecks])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchInput }))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleArchiveToggle = async (deck) => {
    const newStatus = deck.status === 'archived' 
      ? (deck.publishedAt ? 'published' : 'draft') 
      : 'archived'
    try {
      await updateAdminDeckApi(deck._id, { ...deck, status: newStatus, title: deck.title })
      fetchDecks(pagination.page)
    } catch {
      // silently fail
    }
  }

  const handleClearFilters = () => {
    setSearchInput('')
    setFilters({ q: '', cefrLevelId: '', tagId: '', status: '' })
  }

  const from = (pagination.page - 1) * LIMIT + 1
  const to = Math.min(pagination.page * LIMIT, pagination.totalItems)

  return (
    <div className="admin-deck-list-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{t('admin.deckListTitle')}</h1>
          <p className="admin-page-subtitle">{t('admin.deckListSubtitle')}</p>
        </div>
        <button
          className="admin-create-btn"
          onClick={() => onNavigate && onNavigate('/admin/decks/new')}
        >
          {t('admin.createDeckBtn')}
        </button>
      </div>

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
            placeholder={t('admin.searchPlaceholder')}
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
          {cefrLevels.map((l) => (
            <option key={l._id} value={l._id}>{l.label || l.code}</option>
          ))}
        </select>

        <select
          className="admin-filter-select"
          value={filters.tagId}
          onChange={(e) => setFilters((prev) => ({ ...prev, tagId: e.target.value }))}
        >
          <option value="">{t('admin.filterTag')}</option>
          {tags.map((tag) => (
            <option key={tag._id} value={tag._id}>{tag.label}</option>
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
          <option value="archived">{t('admin.archived')}</option>
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

      {/* Deck Grid */}
      {!loading && (
        <div className="admin-deck-grid">
          {decks.map((deck) => {
            const isArchived = deck.status === 'archived'
            const cefrList = deck.cefrLevelIds || []
            const tagList = deck.tagIds || []

            // CEFR Labels mapping
            const cefrLabels = cefrList.map(lvl => {
              if (lvl.label || lvl.code) return lvl.label || lvl.code
              const found = cefrLevels.find(c => c._id === lvl)
              return found ? (found.label || found.code) : lvl
            }).filter(Boolean)

            // Tag Labels mapping
            const tagLabels = tagList.map(tag => {
              if (tag.label) return tag.label
              const found = tags.find(t => t._id === tag)
              return found ? found.label : tag
            }).filter(Boolean)

            return (
              <div key={deck._id} className={`admin-deck-card ${isArchived ? 'archived' : ''}`}>
                {/* Cover */}
                <div className="admin-deck-cover">
                  {deck.coverImage ? (
                    <img src={deck.coverImage} alt={deck.title} />
                  ) : (
                    <div className="admin-deck-cover-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                      </svg>
                    </div>
                  )}

                  {/* Status Badge */}
                  {(deck.status === 'draft' || deck.status === 'archived') && (
                    <div className="admin-deck-status-badge">
                      <span className={`admin-status-pill ${deck.status}`}>
                        {deck.status === 'draft' ? t('admin.statusDraft') : t('admin.archived')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="admin-deck-content">
                  <div className="admin-deck-meta">
                    {cefrLabels.map((lbl, idx) => (
                      <span key={idx} className="admin-meta-badge cefr-badge">
                        {lbl}
                      </span>
                    ))}
                    {tagLabels.map((lbl, idx) => (
                      <span key={idx} className="admin-meta-badge tag-badge">
                        {lbl}
                      </span>
                    ))}
                  </div>

                  <h3 className="admin-deck-title">{deck.title}</h3>
                  <p className="admin-deck-desc">{deck.description}</p>

                  <div className="admin-deck-stats">
                    <span className="admin-deck-stat">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      {deck.topicCount || 0} {t('admin.topics')}
                    </span>
                    <span className="admin-deck-stat">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      {deck.cardCount || 0} {t('admin.cards')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="admin-deck-actions">
                  <button
                    className="admin-deck-action-btn"
                    title="Chỉnh sửa"
                    onClick={() => onNavigate && onNavigate(`/admin/decks/${deck._id}/edit`)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  {deck.status !== 'draft' && (
                    <button
                      className={`admin-deck-action-btn ${isArchived ? 'unarchive' : ''}`}
                      title={isArchived ? t('admin.unarchive') : t('admin.archive')}
                      onClick={() => handleArchiveToggle(deck)}
                    >
                      {isArchived ? (
                        /* Unarchive icon - box with up arrow */
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <polyline points="21 8 21 21 3 21 3 8" />
                          <rect x="1" y="3" width="22" height="5" rx="1" />
                          <line x1="10" y1="12" x2="14" y2="12" />
                          <polyline points="10 16 12 12 14 16" />
                        </svg>
                      ) : (
                        /* Archive icon - box with down arrow */
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <polyline points="21 8 21 21 3 21 3 8" />
                          <rect x="1" y="3" width="22" height="5" rx="1" />
                          <line x1="10" y1="12" x2="14" y2="12" />
                        </svg>
                      )}
                    </button>
                  )}

                  <a
                    href={`/admin/decks/${deck._id}`}
                    onClick={(e) => { e.preventDefault(); onNavigate && onNavigate(`/admin/decks/${deck._id}`) }}
                    className="admin-deck-detail-link"
                  >
                    {t('admin.detail')}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                </div>
              </div>
            )
          })}

          {/* Create new card placeholder */}
          <button
            className="admin-deck-create-card"
            onClick={() => onNavigate && onNavigate('/admin/decks/new')}
          >
            <div className="admin-deck-create-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className="admin-deck-create-label">{t('admin.createDeckCard')}</span>
            <span className="admin-deck-create-desc">{t('admin.createDeckCardDesc')}</span>
          </button>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalItems > 0 && (
        <div className="admin-pagination">
          <span className="admin-pagination-info">
            {t('admin.pagination', { from, to, total: pagination.totalItems })}
          </span>
          <div className="admin-pagination-controls">
            <button
              className="admin-pagination-btn"
              disabled={pagination.page <= 1}
              onClick={() => fetchDecks(pagination.page - 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`admin-pagination-btn ${p === pagination.page ? 'active' : ''}`}
                onClick={() => fetchDecks(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="admin-pagination-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchDecks(pagination.page + 1)}
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

export default AdminDeckListPage
