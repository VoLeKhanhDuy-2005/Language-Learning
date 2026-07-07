import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAdminDeckByIdApi,
  getDeckTopicsApi,
  listDeckCardsApi,
  reorderTopicCardsApi,
  deleteDeckCardApi,
  deleteMultipleDeckCardsApi
} from '../../adminApi'
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal'
import AdminImportExportModal from '../../components/AdminImportExportModal/AdminImportExportModal'
import './AdminCardListPage.css'

function AdminCardListPage({ deckId, topicId, onNavigate }) {
  const { t, i18n } = useTranslation()

  // Data states
  const [deck, setDeck] = useState(null)
  const [topics, setTopics] = useState([])
  const [topic, setTopic] = useState(null)
  const [cards, setCards] = useState([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Search, filter, layout, pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPos, setSelectedPos] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [page, setPage] = useState(1)
  const [limit] = useState(8)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = useState(null)

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState(null)

  // Bulk select states
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  // Import/Export modal state
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false)

  // Debouncing search term
  const searchTimeoutRef = useRef(null)

  // Fetch Deck & Topic Details
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true)
        const [deckRes, topicsRes] = await Promise.all([
          getAdminDeckByIdApi(deckId),
          getDeckTopicsApi(deckId)
        ])
        setDeck(deckRes.data)
        setTopics(topicsRes.data || [])
        
        const currentTopic = (topicsRes.data || []).find(t => t._id === topicId)
        if (currentTopic) {
          setTopic(currentTopic)
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Không thể tải thông tin bộ từ/chủ đề')
      } finally {
        setLoading(false)
      }
    }

    if (deckId && topicId) {
      fetchMetadata()
    }
  }, [deckId, topicId])

  // Fetch cards list
  const fetchCards = async (currentPage = page, search = searchTerm, pos = selectedPos) => {
    try {
      setCardsLoading(true)
      const res = await listDeckCardsApi(deckId, {
        topicId,
        q: search,
        pos: pos || undefined,
        page: currentPage,
        limit
      })
      // Sort local cards by order field to ensure consistent UI sorting
      const sortedCards = [...(res.data?.cards || [])].sort((a, b) => a.order - b.order)
      setCards(sortedCards)
      setTotalItems(res.data?.pagination?.totalItems || 0)
      setTotalPages(res.data?.pagination?.totalPages || 1)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách thẻ từ vựng')
    } finally {
      setCardsLoading(false)
    }
  }

  // Fetch cards on filters / page change
  useEffect(() => {
    if (deckId && topicId) {
      fetchCards(page, searchTerm, selectedPos)
    }
  }, [deckId, topicId, page, selectedPos])

  // Handle live search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setPage(1)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchCards(1, value, selectedPos)
    }, 400)
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Drag and drop handlers (Swap style reordering)
  const handleDragStart = (e, index) => {
    // Only allow dragging when not loading/searching
    if (searchTerm || selectedPos) return
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    if (searchTerm || selectedPos) return
    e.preventDefault()
  }

  const handleDrop = async (e, index) => {
    if (searchTerm || selectedPos) return
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    try {
      // Create a copy and swap the dragged card with target card
      const reordered = [...cards]
      const temp = reordered[draggedIndex]
      reordered[draggedIndex] = reordered[index]
      reordered[index] = temp

      // Update local state temporarily for immediate visual feedback
      setCards(reordered)

      // Map the new order indices to matching database IDs.
      // E.g. we keep the actual 'order' numbers at those slots but swap cards inside.
      const payload = reordered.map((card, idx) => ({
        cardId: card._id,
        order: idx + 1 + (page - 1) * limit
      }))

      // Persist to database
      const res = await reorderTopicCardsApi(topicId, payload)
      setSuccessMsg(t('api.success.CARD_REORDERED_SUCCESS'))
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)

      // Re-fetch to sync clean data
      await fetchCards(page, searchTerm, selectedPos)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || t('api.error.INTERNAL_ERROR'))
      setTimeout(() => {
        setErrorMsg('')
      }, 3000)
      // Revert local state by re-fetching
      await fetchCards(page, searchTerm, selectedPos)
    } finally {
      setDraggedIndex(null)
    }
  }

  // Delete handlers
  const handleDeleteClick = (card, e) => {
    e.stopPropagation()
    setCardToDelete(card)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return
    try {
      const res = await deleteDeckCardApi(deckId, cardToDelete._id)
      setSuccessMsg(t('api.success.CARD_DELETE_SUCCESS'))
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)

      // Adjust page if we deleted the last card on the current page
      const newPage = (cards.length === 1 && page > 1) ? page - 1 : page
      setPage(newPage)
      await fetchCards(newPage, searchTerm, selectedPos)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || t('api.error.INTERNAL_ERROR'))
      setTimeout(() => {
        setErrorMsg('')
      }, 3000)
    } finally {
      setIsDeleteModalOpen(false)
      setCardToDelete(null)
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

  const handleToggleSelect = (cardId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const allIds = new Set(cards.map(c => c._id))
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
      const cardIds = Array.from(selectedIds)
      await deleteMultipleDeckCardsApi(deckId, cardIds)
      setSuccessMsg(t('api.success.CARD_DELETE_SUCCESS'))
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)

      // Adjust page if we deleted all cards on the current page
      const newPage = (cards.length === selectedIds.size && page > 1) ? page - 1 : page
      setPage(newPage)
      setIsSelectMode(false)
      setSelectedIds(new Set())
      await fetchCards(newPage, searchTerm, selectedPos)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || t('api.error.INTERNAL_ERROR'))
      setTimeout(() => {
        setErrorMsg('')
      }, 3000)
    } finally {
      setIsBulkDeleteModalOpen(false)
    }
  }

  // POS Formatter helper
  const formatPos = (pos) => {
    if (!pos) return ''
    const mapping = {
      adjective: t('admin.posAdjective') || 'Tính từ',
      adverb: t('admin.posAdverb') || 'Trạng từ',
      'auxiliary verb': t('admin.posAuxiliaryVerb') || 'Trợ động từ',
      collocation: t('admin.posCollocation') || 'Cụm liên kết',
      conjunction: t('admin.posConjunction') || 'Liên từ',
      determiner: t('admin.posDeterminer') || 'Từ hạn định',
      idiom: t('admin.posIdiom') || 'Thành ngữ',
      interjection: t('admin.posInterjection') || 'Thán từ',
      'modal verb': t('admin.posModalVerb') || 'Động từ khuyết thiếu',
      noun: t('admin.posNoun') || 'Danh từ',
      'phrasal verb': t('admin.posPhrasalVerb') || 'Cụm động từ',
      phrase: t('admin.posPhrase') || 'Cụm từ',
      preposition: t('admin.posPreposition') || 'Giới từ',
      pronoun: t('admin.posPronoun') || 'Đại từ',
      verb: t('admin.posVerb') || 'Động từ'
    }
    return mapping[pos.toLowerCase()] || pos
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
        <span>{t('admin.loading')}</span>
      </div>
    )
  }

  // Pagination calculation texts
  const displayFrom = totalItems === 0 ? 0 : (page - 1) * limit + 1
  const displayTo = Math.min(page * limit, totalItems)

  return (
    <div className="admin-card-list-container">
      {/* Alerts */}
      {successMsg && <div className="admin-alert alert-success">{successMsg}</div>}
      {errorMsg && <div className="admin-alert alert-error">{errorMsg}</div>}

      {/* Breadcrumbs */}
      <div className="admin-breadcrumbs">
        <span className="breadcrumb-link" onClick={() => onNavigate('/admin/decks')}>
          {t('admin.decksBreadcrumb') || 'Bộ từ vựng'}
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-link" onClick={() => onNavigate(`/admin/decks/${deckId}`)}>
          {deck?.title || 'Bộ từ'}
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-active">
          {topic?.name || 'Chủ đề'}
        </span>
      </div>

      {/* Header */}
      <div className="admin-cards-header-section">
        <h1 className="admin-cards-title">{topic?.name || 'Chi tiết thẻ từ vựng'}</h1>
        
        <div className="admin-cards-header-actions">
          {/* Select Mode Button */}
          <button
            type="button"
            className={`admin-select-mode-btn ${isSelectMode ? 'active' : ''}`}
            onClick={handleToggleSelectMode}
            title={isSelectMode ? t('admin.cancelSelectModeBtn') : t('admin.selectModeBtn')}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            {isSelectMode ? t('admin.cancelSelectModeBtn') || 'Hủy chọn' : t('admin.selectModeBtn') || 'Chọn'}
          </button>

          {/* Import/Export Button */}
          <button
            type="button"
            className="admin-ie-trigger-btn"
            onClick={() => setIsImportExportModalOpen(true)}
            title={t('admin.importExportModalTitle')}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('admin.importExportBtn')}
          </button>

          {/* Add Card Button */}
          <button
            type="button"
            className="admin-create-card-btn"
            onClick={() => onNavigate(`/admin/decks/${deckId}/topics/${topicId}/cards/new`)}
          >
            <span>{t('admin.addCardBtn') || '+ Thêm thẻ mới'}</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search, POS filter, Layout toggle */}
      <div className="admin-cards-controls-bar">
        <div className="admin-search-wrapper">
          <svg className="admin-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder={t('admin.searchCardsPlaceholder') || 'Tìm kiếm từ...'}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="admin-filters-right">
          <select
            className="admin-pos-select"
            value={selectedPos}
            onChange={(e) => {
              setSelectedPos(e.target.value)
              setPage(1)
            }}
          >
            <option value="">{t('admin.allPosFilter') || 'Tất cả từ loại'}</option>
            <option value="noun">{t('admin.posNoun') || 'Danh từ'}</option>
            <option value="verb">{t('admin.posVerb') || 'Động từ'}</option>
            <option value="adjective">{t('admin.posAdjective') || 'Tính từ'}</option>
            <option value="adverb">{t('admin.posAdverb') || 'Trạng từ'}</option>
            <option value="preposition">{t('admin.posPreposition') || 'Giới từ'}</option>
            <option value="conjunction">{t('admin.posConjunction') || 'Liên từ'}</option>
            <option value="pronoun">{t('admin.posPronoun') || 'Đại từ'}</option>
            <option value="phrasal verb">{t('admin.posPhrasalVerb') || 'Cụm động từ'}</option>
            <option value="idiom">{t('admin.posIdiom') || 'Thành ngữ'}</option>
          </select>

          {/* Layout Toggle Buttons */}
          <div className="admin-layout-toggle-group">
            <button
              type="button"
              className={`layout-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Grid View"
              onClick={() => setViewMode('grid')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              className={`layout-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="List View"
              onClick={() => setViewMode('list')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {isSelectMode && cards.length > 0 && (
        <div className="admin-bulk-action-bar">
          <div className="admin-bulk-left">
            <label className="admin-bulk-checkbox-label">
              <input
                type="checkbox"
                className="admin-bulk-checkbox"
                checked={selectedIds.size === cards.length}
                onChange={selectedIds.size === cards.length ? handleDeselectAll : handleSelectAll}
              />
              <span>{selectedIds.size === cards.length ? t('admin.deselectAllBtn') || 'Bỏ chọn tất cả' : t('admin.selectAllBtn') || 'Chọn tất cả'}</span>
            </label>
            <span className="admin-bulk-count">
              {t('admin.deleteSelectedBtn', { count: selectedIds.size }) || `Xóa đã chọn (${selectedIds.size})`}
            </span>
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

      {/* Main Content Area */}
      {cardsLoading ? (
        <div className="admin-cards-loading-area">
          <div className="admin-loading-spinner"></div>
        </div>
      ) : cards.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View Layout */
          <div className="admin-cards-grid">
            {cards.map((card, index) => {
              const phoneticText = card.phonetics?.[0]?.text || ''
              const exampleVi = card.examples?.vi || ''
              const isSelected = selectedIds.has(card._id)
              
              return (
                <div
                  key={card._id}
                  draggable={!searchTerm && !selectedPos && !isSelectMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`admin-card-grid-item ${draggedIndex === index ? 'dragging' : ''} ${isSelectMode ? 'select-mode' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={isSelectMode ? () => handleToggleSelect(card._id) : undefined}
                >
                  {/* Select checkbox overlay */}
                  {isSelectMode && (
                    <div className="admin-card-select-overlay" onClick={(e) => { e.stopPropagation(); handleToggleSelect(card._id); }}>
                      <input
                        type="checkbox"
                        className="admin-card-select-checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                      />
                    </div>
                  )}

                  <div className="card-image-wrapper">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.term} className="card-image" />
                    ) : (
                      <div className="card-image-fallback">
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="card-content-area">
                    <div className="card-title-row">
                      <h3 className="card-translation">{card.translation}</h3>
                      {!isSelectMode && (
                        <div className="card-actions">
                          <button
                            type="button"
                            className="card-action-btn edit-btn"
                            onClick={() => onNavigate(`/admin/decks/${deckId}/topics/${topicId}/cards/${card._id}/edit`)}
                            title={t('admin.editCardBtn')}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button type="button" className="card-action-btn delete-btn" onClick={(e) => handleDeleteClick(card, e)} title={t('admin.deleteTag')}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="card-term-ipa">
                      <span className="card-term">{card.term}</span>
                      {phoneticText && <span className="card-ipa">/{phoneticText.replace(/^\/|\/$/g, '')}/</span>}
                    </p>

                    <p className="card-definition">
                      {card.explanation?.vi || card.explanation?.en || ''}
                    </p>

                    <div className="card-footer-info">
                      <span className="card-order-badge">{card.order}</span>
                      {card.pos && <span className="card-pos-badge">{formatPos(card.pos)}</span>}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Instruction sorting Card in the grid */}
            {!searchTerm && !selectedPos && !isSelectMode && (
              <div className="admin-card-reorder-instruction-card">
                <div className="instruction-icon-circle">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="4 17 10 11 4 5" />
                    <line x1="12" y1="18" x2="20" y2="18" />
                    <polyline points="20 7 14 13 20 19" />
                  </svg>
                </div>
                <h4 className="instruction-card-title">{t('admin.cardReorderTitle') || 'Sắp xếp thứ tự các thẻ'}</h4>
                <p className="instruction-card-desc">
                  {t('admin.cardReorderDesc') || 'Kéo thả các thẻ để thay đổi trình tự học tập cho học viên.'}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* List View Layout */
          <div className="admin-cards-list-view">
            <table className="admin-cards-table">
              <thead>
                <tr>
                  {isSelectMode && (
                    <th style={{ width: '50px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="admin-table-select-all"
                        checked={selectedIds.size === cards.length && cards.length > 0}
                        onChange={selectedIds.size === cards.length ? handleDeselectAll : handleSelectAll}
                      />
                    </th>
                  )}
                  <th style={{ width: '80px' }}>{t('admin.tableHeaderOrder') || 'SỐ THỨ TỰ'}</th>
                  <th style={{ width: '80px' }}>{t('admin.tableHeaderImage') || 'Hình ảnh'}</th>
                  <th>{t('admin.tableHeaderTerm') || 'Từ chính (Term)'}</th>
                  <th>{t('admin.tableHeaderPhonetic') || 'Phiên âm'}</th>
                  <th>{t('admin.tableHeaderPos') || 'Từ loại'}</th>
                  <th>{t('admin.tableHeaderTranslation') || 'Nghĩa (Translation)'}</th>
                  <th>{t('admin.tableHeaderDefinition') || 'Định nghĩa'}</th>
                  {!isSelectMode && <th style={{ width: '120px', textAlign: 'center' }}>{t('admin.tableHeaderActions') || 'Thao tác'}</th>}
                </tr>
              </thead>
              <tbody>
                {cards.map((card, index) => {
                  const isSelected = selectedIds.has(card._id)
                  return (
                    <tr 
                      key={card._id}
                      draggable={!searchTerm && !selectedPos && !isSelectMode}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`${draggedIndex === index ? 'dragging-row' : ''} ${isSelectMode ? 'select-mode' : ''} ${isSelected ? 'selected-row' : ''}`}
                      onClick={isSelectMode ? () => handleToggleSelect(card._id) : undefined}
                    >
                      {isSelectMode && (
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            className="admin-row-select-checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(card._id)}
                          />
                        </td>
                      )}
                      <td>
                        <span className="list-order-number">{card.order}</span>
                      </td>
                      <td>
                        <div className="list-image-container">
                          {card.imageUrl ? (
                            <img src={card.imageUrl} alt={card.term} className="list-row-image" />
                          ) : (
                            <div className="list-row-image-fallback">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong className="list-card-term">{card.term}</strong>
                      </td>
                      <td>
                        <span className="list-card-ipa">/{ (card.phonetics?.[0]?.text || '').replace(/^\/|\/$/g, '') }/</span>
                      </td>
                      <td>
                        <span className="list-pos-badge">{formatPos(card.pos)}</span>
                      </td>
                      <td>
                        <span className="list-card-translation">{card.translation}</span>
                      </td>
                      <td>
                        <div className="list-card-definition">
                          {card.explanation?.vi || card.explanation?.en || ''}
                        </div>
                      </td>
                      {!isSelectMode && (
                        <td>
                          <div className="list-row-actions">
                            <button
                              type="button"
                              className="list-action-btn edit-btn"
                              onClick={() => onNavigate(`/admin/decks/${deckId}/topics/${topicId}/cards/${card._id}/edit`)}
                              title={t('admin.editCardBtn')}
                            >
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button type="button" className="list-action-btn delete-btn" onClick={(e) => handleDeleteClick(card, e)} title={t('admin.deleteTag')}>
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="admin-cards-empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
          <p>
            {searchTerm || selectedPos 
              ? t('api.error.CARD_NOT_FOUND') || 'Không tìm thấy thẻ từ vựng'
              : t('admin.noCardsPlaceholder') || 'Chủ đề này chưa có thẻ từ vựng.'}
          </p>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <span className="admin-pagination-info">
            {t('admin.paginationCards', { from: displayFrom, to: displayTo, total: totalItems }) ||
              `Đang hiển thị ${displayFrom}-${displayTo} trên ${totalItems} thẻ`}
          </span>

          <div className="admin-pagination-controls">
            <button
              type="button"
              className="admin-pagination-btn"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1
              return (
                <button
                  key={p}
                  type="button"
                  className={`admin-pagination-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            })}
            <button
              type="button"
              className="admin-pagination-btn"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Single Deletion ConfirmModal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={t('admin.confirmDeleteCardTitle') || 'Xóa thẻ từ vựng'}
        message={t('admin.confirmDeleteCardMessage') || 'Bạn có chắc chắn muốn xóa thẻ từ vựng này không?'}
        confirmText={t('admin.deleteBtn') || 'Xóa'}
        cancelText={t('admin.cancelBtn') || 'Hủy'}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setCardToDelete(null)
        }}
        isDanger={true}
      />

      {/* Bulk Deletion ConfirmModal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title={t('admin.confirmDeleteMultipleCardsTitle') || 'Xóa các thẻ đã chọn'}
        message={t('admin.confirmDeleteMultipleCardsMessage', { count: selectedIds.size }) || `Bạn có chắc chắn muốn xóa ${selectedIds.size} thẻ đã chọn? Hành động này không thể hoàn tác.`}
        confirmText={t('admin.deleteBtn') || 'Xóa'}
        cancelText={t('admin.cancelBtn') || 'Hủy'}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
        isDanger={true}
      />

      {/* Import/Export Modal */}
      {isImportExportModalOpen && topic && (
        <AdminImportExportModal
          deckId={deckId}
          topic={topic}
          onClose={() => setIsImportExportModalOpen(false)}
          onImportSuccess={() => {
            setIsImportExportModalOpen(false)
            fetchCards(1, searchTerm, selectedPos)
          }}
        />
      )}
    </div>
  )
}

export default AdminCardListPage