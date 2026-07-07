import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAdminDeckByIdApi,
  getDeckTopicsApi,
  createDeckTopicApi,
  updateDeckTopicApi,
  deleteDeckTopicApi,
  deleteMultipleDeckTopicsApi,
  reorderDeckTopicsApi,
  listDeckCardsApi
} from '../../adminApi'
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal'
import './AdminDeckTopicPage.css'

function AdminDeckTopicPage({ onNavigate, deckId }) {
  const { t, i18n } = useTranslation()

  // State
  const [deck, setDeck] = useState(null)
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form edit states
  const [editName, setEditName] = useState('')
  const [editOrder, setEditOrder] = useState(0)

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = useState(null)

  // Confirm Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Bulk select states
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  // Feedback Alerts states
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch Deck & Topics
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [deckRes, topicsRes] = await Promise.all([
        getAdminDeckByIdApi(deckId),
        getDeckTopicsApi(deckId)
      ])
      
      const deckData = deckRes.data
      const topicsData = topicsRes.data || []
      
      setDeck(deckData)
      // Sort topics by order initially
      const sortedTopics = [...topicsData].sort((a, b) => a.order - b.order)
      setTopics(sortedTopics)

      // Automatically select first topic if available
      if (sortedTopics.length > 0) {
        // We pass the sorted list to make sure we load the correct topic
        handleSelectTopic(sortedTopics[0])
      } else {
        setSelectedTopic(null)
      }
    } catch (err) {
      setError(t('admin.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [deckId, t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Select a topic to view details & cards
  const handleSelectTopic = async (topic) => {
    setSuccessMsg('')
    setErrorMsg('')
    setSelectedTopic(topic)
    setEditName(topic.name || '')
    setEditOrder(topic.order || 0)
    
    if (topic._id && topic._id !== 'new') {
      try {
        setCardsLoading(true)
        const cardsRes = await listDeckCardsApi(deckId, { topicId: topic._id, limit: 100 })
        setCards(cardsRes.data?.cards || [])
      } catch {
        setCards([])
      } finally {
        setCardsLoading(false)
      }
    } else {
      setCards([])
    }
  }

  // Handle click to create a new topic
  const handleAddNewTopic = () => {
    setSuccessMsg('')
    setErrorMsg('')
    const nextOrder = topics.length > 0 ? Math.max(...topics.map(t => t.order)) + 1 : 1
    const newTopic = {
      _id: 'new',
      name: '',
      order: nextOrder
    }
    setSelectedTopic(newTopic)
    setEditName('')
    setEditOrder(nextOrder)
    setCards([])
  }

  // Handle form Save
  const handleSaveChanges = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return
    setSuccessMsg('')
    setErrorMsg('')

    try {
      let updatedSelectedTopic = selectedTopic
      let updatedTopicsList = [...topics]
      let actionRes

      if (selectedTopic._id === 'new') {
        // Create new
        const res = await createDeckTopicApi(deckId, {
          name: editName,
          order: Number(editOrder)
        })
        updatedSelectedTopic = res.data
        updatedTopicsList = [...topics, updatedSelectedTopic]
        actionRes = res
      } else {
        // Update existing
        const res = await updateDeckTopicApi(deckId, selectedTopic._id, {
          name: editName,
          order: Number(editOrder)
        })
        updatedSelectedTopic = res.data
        updatedTopicsList = topics.map(t => t._id === selectedTopic._id ? updatedSelectedTopic : t)
        actionRes = res
      }

      // Re-index their order sequentially and persist to database
      const finalPayload = updatedTopicsList.map((t, idx) => ({
        topicId: t._id,
        order: idx + 1
      }))

      if (finalPayload.length > 0) {
        await reorderDeckTopicsApi(deckId, finalPayload)
      }

      // Re-fetch topics and deck to get clean persisted data from database
      const [deckRes, topicsRes] = await Promise.all([
        getAdminDeckByIdApi(deckId),
        getDeckTopicsApi(deckId)
      ])
      setDeck(deckRes.data)
      const sortedTopics = [...(topicsRes.data || [])].sort((a, b) => a.order - b.order)
      setTopics(sortedTopics)

      // Re-select the updated/created topic
      const newSelected = sortedTopics.find(t => t._id === updatedSelectedTopic._id) || updatedSelectedTopic
      handleSelectTopic(newSelected)
      
      // Show appropriate success message based on action
      if (selectedTopic._id === 'new') {
        setSuccessMsg(t('api.success.TOPIC_CREATE_SUCCESS'))
      } else {
        setSuccessMsg(t('api.success.TOPIC_UPDATE_SUCCESS'))
      }
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi lưu chủ đề')
      setTimeout(() => {
        setErrorMsg('')
      }, 3000)
    }
  }

  // Handle delete click
  const handleDeleteClick = () => {
    if (selectedTopic && selectedTopic._id !== 'new') {
      setIsDeleteModalOpen(true)
    }
  }

  // Confirm delete topic
  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false)
    if (!selectedTopic || selectedTopic._id === 'new') return
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await deleteDeckTopicApi(deckId, selectedTopic._id)
      const remainingTopics = topics
        .filter(t => t._id !== selectedTopic._id)
        .map(t => {
          if (t.order > selectedTopic.order) {
            return { ...t, order: t.order - 1 }
          }
          return t
        })
      setTopics(remainingTopics)

      // Re-fetch deck to update stats
      const deckRes = await getAdminDeckByIdApi(deckId)
      setDeck(deckRes.data)

      // Select another topic
      if (remainingTopics.length > 0) {
        handleSelectTopic(remainingTopics[0])
      } else {
        setSelectedTopic(null)
      }
      
      setSuccessMsg(t('api.success.TOPIC_DELETE_SUCCESS'))
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi xóa chủ đề')
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

  const handleToggleSelect = (topicId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(topicId)) {
        next.delete(topicId)
      } else {
        next.add(topicId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const allIds = new Set(topics.filter(t => t._id !== 'new').map(t => t._id))
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
      const topicIds = Array.from(selectedIds)
      await deleteMultipleDeckTopicsApi(deckId, topicIds)
      setSuccessMsg(t('api.success.TOPIC_DELETE_SUCCESS'))
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)

      // Re-fetch data
      setIsSelectMode(false)
      setSelectedIds(new Set())
      await fetchData()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi xóa chủ đề')
      setTimeout(() => {
        setErrorMsg('')
      }, 3000)
    } finally {
      setIsBulkDeleteModalOpen(false)
    }
  }

  // Drag and drop sorting logic
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
  }

  const handleDrop = async (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const reordered = [...topics]
    // Swap the elements at draggedIndex and hoverIndex (swap style)
    const temp = reordered[draggedIndex]
    reordered[draggedIndex] = reordered[index]
    reordered[index] = temp

    // Re-index their order sequentially in local state
    const updatedWithOrder = reordered.map((topic, idx) => ({
      ...topic,
      order: idx + 1
    }))

    setTopics(updatedWithOrder)
    setDraggedIndex(null)

    // Clear and prepare feedback messages
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const finalPayload = updatedWithOrder.map((t, idx) => ({
        topicId: t._id,
        order: idx + 1
      }))

      if (finalPayload.length > 0) {
        const res = await reorderDeckTopicsApi(deckId, finalPayload)
        setSuccessMsg(t('api.success.TOPIC_REORDERED_SUCCESS'))
        setTimeout(() => {
          setSuccessMsg('')
        }, 3000)
      }

      // Re-fetch topics and deck to get clean persisted data from database
      const [deckRes, topicsRes] = await Promise.all([
        getAdminDeckByIdApi(deckId),
        getDeckTopicsApi(deckId)
      ])
      setDeck(deckRes.data)
      const sortedTopics = [...(topicsRes.data || [])].sort((a, b) => a.order - b.order)
      setTopics(sortedTopics)

      // Sync active selectedTopic order and state
      if (selectedTopic) {
        const newSelected = sortedTopics.find(t => t._id === selectedTopic._id)
        if (newSelected) {
          setSelectedTopic(newSelected)
          setEditOrder(newSelected.order || 0)
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thứ tự')
      setTimeout(() => {
        setErrorMsg('')
      }, 3000)
    }
  }

  // POS formatter helpers
  const formatPos = (pos) => {
    if (!pos) return ''
    const mapping = {
      adjective: t('admin.posAdjective') || 'Tính từ',
      adverb: t('admin.posAdverb') || 'Trạng từ',
      'auxiliary verb': t('admin.posAuxiliaryVerb') || 'Trợ động từ',
      collocation: t('admin.posCollocation') || 'Collocation',
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

  // Timeago helper
  const formatRelativeTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    const isVi = i18n.language === 'vi'

    if (diffMins < 60) {
      if (diffMins <= 1) return isVi ? 'Vừa xong' : 'Just now'
      return isVi ? `${diffMins} phút trước` : `${diffMins}m ago`
    }
    if (diffHours < 24) {
      return isVi ? `${diffHours} giờ trước` : `${diffHours}h ago`
    }
    if (diffDays < 30) {
      return isVi ? `${diffDays} ngày trước` : `${diffDays}d ago`
    }
    return date.toLocaleDateString(isVi ? 'vi-VN' : 'en-US')
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner"></div>
        <span>{t('admin.loading')}</span>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="admin-error-message">
        {error || t('admin.deckNotFound')}
      </div>
    )
  }

  // Map CEFR levels from populated list
  const cefrLabels = (deck.cefrLevelIds || []).map(c => c.label || c.code).filter(Boolean)

  return (
    <div className="admin-deck-topic-page">
      {/* Breadcrumb */}
      <div className="admin-topic-breadcrumbs">
        <span className="breadcrumb-link" onClick={() => onNavigate('/admin/decks')}>
          {t('admin.decksBreadcrumb') || 'Bộ từ vựng'}
        </span>
        <svg className="breadcrumb-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="breadcrumb-current">{deck.title}</span>
      </div>

      {/* Alerts */}
      {successMsg && <div className="admin-alert success" style={{ marginBottom: '16px' }}>{successMsg}</div>}
      {errorMsg && <div className="admin-alert error" style={{ marginBottom: '16px' }}>{errorMsg}</div>}

      {/* Header section with Stats */}
      <div className="admin-topic-header-row">
        <div className="admin-topic-header-left">
          <h1 className="admin-topic-deck-title">
            {deck.title}
            {cefrLabels.map((lbl, idx) => (
              <span key={idx} className="admin-topic-cefr-badge">
                {lbl}
              </span>
            ))}
          </h1>
        </div>

        <div className="admin-topic-stats-row">
          <div className="admin-topic-stat-card">
            <div className="stat-card-icon red-icon">
              {/* Flashcard icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="6" y1="8" x2="18" y2="8" />
                <line x1="6" y1="12" x2="14" y2="12" />
              </svg>
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">{t('admin.totalCards')}</span>
              <span className="stat-card-value">{(deck.cardCount || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="admin-topic-stat-card">
            <div className="stat-card-icon blue-icon">
              {/* Folder/topics icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">{t('admin.totalTopics')}</span>
              <span className="stat-card-value">{deck.topicCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="admin-topic-grid">
        {/* Left column: Topic Structure */}
        <div className="admin-topic-left-col">
          <div className="admin-topic-col-header">
            <h2 className="admin-topic-col-title">{t('admin.topicStructure')}</h2>
            <div className="admin-topic-col-actions">
              {/* Select Mode Button */}
              <button
                type="button"
                className={`admin-topic-select-mode-btn ${isSelectMode ? 'active' : ''}`}
                onClick={handleToggleSelectMode}
                title={isSelectMode ? t('admin.cancelSelectModeBtn') : t('admin.selectModeBtn')}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                {isSelectMode ? t('admin.cancelSelectModeBtn') || 'Hủy chọn' : t('admin.selectModeBtn') || 'Chọn'}
              </button>
              <button className="admin-add-topic-btn" onClick={handleAddNewTopic}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t('admin.addTopicBtn')}
              </button>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {isSelectMode && topics.filter(t => t._id !== 'new').length > 0 && (
            <div className="admin-topic-bulk-bar">
              <div className="admin-bulk-left">
                <label className="admin-bulk-checkbox-label">
                  <input
                    type="checkbox"
                    className="admin-bulk-checkbox"
                    checked={selectedIds.size === topics.filter(t => t._id !== 'new').length}
                    onChange={selectedIds.size === topics.filter(t => t._id !== 'new').length ? handleDeselectAll : handleSelectAll}
                  />
                  <span>{selectedIds.size === topics.filter(t => t._id !== 'new').length ? t('admin.deselectAllBtn') || 'Bỏ chọn tất cả' : t('admin.selectAllBtn') || 'Chọn tất cả'}</span>
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

          <div className="admin-topic-list">
            {topics.map((topic, index) => {
              const isSelected = selectedTopic && selectedTopic._id === topic._id
              const displayIndex = String(topic.order ?? index + 1).padStart(2, '0')
              const isChecked = selectedIds.has(topic._id)

              return (
                <div
                  key={topic._id}
                  draggable={topic._id !== 'new' && !isSelectMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => {
                    if (isSelectMode && topic._id !== 'new') {
                      handleToggleSelect(topic._id)
                    } else {
                      handleSelectTopic(topic)
                    }
                  }}
                  className={`admin-topic-item ${isSelected ? 'selected' : ''} ${draggedIndex === index ? 'dragging' : ''} ${isSelectMode ? 'select-mode' : ''} ${isChecked ? 'checked' : ''}`}
                >
                  {/* Select checkbox in select mode */}
                  {isSelectMode && topic._id !== 'new' && (
                    <div className="admin-topic-select-box">
                      <input
                        type="checkbox"
                        className="admin-topic-select-checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(topic._id)}
                      />
                    </div>
                  )}

                  {/* Reorder drag handle indicator */}
                  {isSelected && topic._id !== 'new' && !isSelectMode && (
                    <div className="admin-topic-drag-dots">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="9" cy="5" r="1" fill="currentColor" />
                        <circle cx="9" cy="12" r="1" fill="currentColor" />
                        <circle cx="9" cy="19" r="1" fill="currentColor" />
                        <circle cx="15" cy="5" r="1" fill="currentColor" />
                        <circle cx="15" cy="12" r="1" fill="currentColor" />
                        <circle cx="15" cy="19" r="1" fill="currentColor" />
                      </svg>
                    </div>
                  )}

                  {/* Index badge */}
                  <div className={`admin-topic-index-badge ${isSelected ? 'selected' : ''}`}>
                    {displayIndex}
                  </div>

                  {/* Topic name and info */}
                  <div className="admin-topic-item-details">
                    <h3 className="admin-topic-item-title">{topic.name || t('admin.newTopicPlaceholder') || 'Chủ đề mới'}</h3>
                    <p className="admin-topic-item-meta">
                      {topic.cardCount || 0} {t('admin.cards').toLowerCase()}
                      {topic.updatedAt && (
                        <>
                          <span className="meta-dot">•</span>
                          {t('admin.updatedAt', { time: formatRelativeTime(topic.updatedAt) })}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Action or indicator */}
                  <div className="admin-topic-item-indicator">
                    {isSelected ? (
                      <span className="admin-topic-active-pill">{t('admin.activeBadge')}</span>
                    ) : (
                      !isSelectMode && (
                        <button className="admin-topic-quick-edit-btn" title={t('admin.editTag')} onClick={(e) => {
                          e.stopPropagation()
                          handleSelectTopic(topic)
                        }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Reorder drag instruction box */}
          {!isSelectMode && (
            <div className="admin-topic-reorder-box">
              <div className="reorder-box-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="18" x2="20" y2="18" />
                  <polyline points="20 7 14 13 20 19" />
                </svg>
              </div>
              <div className="reorder-box-text">
                <h4 className="reorder-title">{t('admin.reorderPlaceholder')}</h4>
                <p className="reorder-desc">{t('admin.reorderTip')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Topic Details */}
        <div className="admin-topic-right-col">
          {selectedTopic ? (
            <form className="admin-topic-details-form" onSubmit={handleSaveChanges}>
              <div className="admin-topic-details-header">
                <h2 className="admin-topic-details-title">{t('admin.topicDetail')}</h2>
                {selectedTopic._id !== 'new' && (
                  <button type="button" className="admin-delete-topic-btn" title={t('admin.deleteTag')} onClick={handleDeleteClick}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Input: Topic Title */}
              <div className="form-group">
                <label className="form-label">{t('admin.topicTitleLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('admin.newTopicPlaceholder') || 'Nhập tiêu đề chủ đề...'}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Cards Preview Section */}
              <div className="admin-card-preview-section">
                <span className="section-label">{t('admin.topicCardPreview')}</span>
                
                {/* Symbolic Add Cards Button */}
                <button
                  type="button"
                  className="admin-add-cards-btn-dashed"
                  disabled={selectedTopic._id === 'new'}
                  onClick={() => {
                    if (selectedTopic._id !== 'new') {
                      onNavigate(`/admin/decks/${deckId}/topics/${selectedTopic._id}/cards`)
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {t('admin.addCardsBtn')}
                </button>

                {/* Cards preview list */}
                {cardsLoading ? (
                  <div className="admin-cards-mini-loading">
                    <div className="admin-loading-spinner small"></div>
                  </div>
                ) : cards.length > 0 ? (
                  <div className="admin-card-preview-list">
                    {cards.map((card) => (
                      <div key={card._id} className="admin-card-preview-item">
                        <span className="card-item-word">"{card.term}"</span>
                        <span className="card-item-pos">{formatPos(card.pos)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  selectedTopic._id !== 'new' && (
                    <p className="admin-no-cards-text">{t('admin.noCardsPlaceholder') || 'Chủ đề này chưa có thẻ từ vựng.'}</p>
                  )
                )}
              </div>

              {/* Submit button */}
              <button type="submit" disabled={!editName.trim()} className="admin-save-topic-btn">
                {t('admin.saveChangesBtn')}
              </button>
            </form>
          ) : (
            <div className="admin-topic-empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <p>{t('admin.selectTopicPrompt') || 'Chọn một chủ đề để xem chi tiết hoặc sắp xếp.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Single Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={t('admin.confirmDeleteTopicTitle')}
        message={t('admin.confirmDeleteTopicMessage')}
        confirmText={t('admin.deleteBtn')}
        cancelText={t('admin.cancelBtn')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDanger={true}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title={t('admin.confirmDeleteMultipleTopicsTitle') || 'Xóa các chủ đề đã chọn'}
        message={t('admin.confirmDeleteMultipleTopicsMessage', { count: selectedIds.size }) || `Bạn có chắc chắn muốn xóa ${selectedIds.size} chủ đề đã chọn? Hành động này không thể hoàn tác.`}
        confirmText={t('admin.deleteBtn') || 'Xóa'}
        cancelText={t('admin.cancelBtn') || 'Hủy'}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
        isDanger={true}
      />
    </div>
  )
}

export default AdminDeckTopicPage