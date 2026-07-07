import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getSystemDecks, getUserDecks, getCefrLevels, getTags, createUserDeck, updateUserDeck, deleteUserDeck } from '../flashcardsApi'
import Filters from '../../../components/Filters/Filters'
import DeckCard from '../components/DeckCard'
import UserDeckCard from '../components/UserDeckCard'
import Input from '../../../components/Input/Input'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import Pagination from '../../../components/Pagination/Pagination'
import './DeckListPage.css'

function DeckListPage({ onNavigate }) {
  const { t } = useTranslation()
  // Trạng thái tab: 'system' (Bộ từ hệ thống) hoặc 'user' (Bộ từ của bạn)
  const [activeTab, setActiveTab] = useState(() => {
    if (window.history.state && window.history.state.tab) {
      return window.history.state.tab
    }
    return 'system'
  })

  // States dữ liệu từ API
  const [decks, setDecks] = useState([])
  const [cefrLevels, setCefrLevels] = useState([])
  const [tags, setTags] = useState([])

  // States lọc và tìm kiếm (chỉ dùng cho tab hệ thống)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedCefrLevelId, setSelectedCefrLevelId] = useState(null)
  const [selectedTagId, setSelectedTagId] = useState(null)

  // States phân trang và trạng thái tải
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(8) // Hiển thị 8 bộ từ mỗi trang
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // States cho modal tạo/sửa bộ từ cá nhân
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingDeck, setEditingDeck] = useState(null)
  const [modalTitle, setModalTitle] = useState('')
  const [modalDesc, setModalDesc] = useState('')
  const [modalError, setModalError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // States cho confirm modal xóa bộ từ
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deletingDeckId, setDeletingDeckId] = useState(null)

  // Fetch CEFR Levels và Tags khi vào trang (chỉ cho bộ từ hệ thống)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cefrData, tagsData] = await Promise.all([
          getCefrLevels(),
          getTags()
        ])

        if (cefrData.success && Array.isArray(cefrData.data)) {
          setCefrLevels(cefrData.data)
        }

        if (tagsData.success && Array.isArray(tagsData.data)) {
          setTags(tagsData.data)
        }
      } catch (err) {
        console.error('Lỗi tải metadata bộ từ:', err)
      }
    }
    fetchMetadata()
  }, [])

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page về 1 khi đổi tab hoặc đổi bộ lọc
  useEffect(() => {
    setPage(1)
  }, [activeTab, debouncedSearchQuery, selectedCefrLevelId, selectedTagId])

  // Reset các bộ lọc và ô tìm kiếm khi chuyển tab
  useEffect(() => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setSelectedCefrLevelId(null)
    setSelectedTagId(null)
  }, [activeTab])

  // Fetch danh sách bộ từ
  useEffect(() => {
    const fetchDecks = async () => {
      setLoading(true)
      setError(null)
      try {
        let response
        const params = {
          page,
          limit,
        }

        if (activeTab === 'system') {
          // Tab bộ từ hệ thống hỗ trợ tìm kiếm và lọc trình độ/chủ đề
          if (debouncedSearchQuery) params.q = debouncedSearchQuery
          if (selectedCefrLevelId) params.cefrLevelId = selectedCefrLevelId
          if (selectedTagId) params.tagId = selectedTagId

          response = await getSystemDecks(params)
        } else {
          // Tab bộ từ cá nhân (Ẩn tìm kiếm và bộ lọc)
          response = await getUserDecks(params)
        }

        if (response.success && response.data) {
          setDecks(response.data.decks || [])
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1)
          }
        } else {
          setError(response.message || t('decks.fetchError'))
        }
      } catch (err) {
        setError(t('decks.serverError'))
      } finally {
        setLoading(false)
      }
    }

    fetchDecks()
  }, [activeTab, page, limit, debouncedSearchQuery, selectedCefrLevelId, selectedTagId, refreshTrigger])

  const handleCefrClick = (levelId) => {
    setSelectedCefrLevelId(prev => (prev === levelId ? null : levelId))
  }

  const handleTagClick = (tagId) => {
    setSelectedTagId(tagId)
  }

  const handleDeckClick = (deckId) => {
    if (onNavigate) {
      if (activeTab === 'system') {
        onNavigate(`/decks/${deckId}`)
      } else {
        onNavigate(`/profile/decks/${deckId}`)
      }
    }
  }

  const openCreateModal = () => {
    setModalMode('create')
    setEditingDeck(null)
    setModalTitle('')
    setModalDesc('')
    setModalError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (deck) => {
    setModalMode('edit')
    setEditingDeck(deck)
    setModalTitle(deck.title || '')
    setModalDesc(deck.description || '')
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDeck(null)
    setModalTitle('')
    setModalDesc('')
    setModalError(null)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!modalTitle.trim()) {
      setModalError(t('decks.errorTitleRequired'))
      return
    }
    setIsSubmitting(true)
    setModalError(null)
    try {
      let response
      if (modalMode === 'create') {
        response = await createUserDeck({ title: modalTitle, description: modalDesc })
      } else {
        response = await updateUserDeck(editingDeck._id, { title: modalTitle, description: modalDesc })
      }

      if (response.success) {
        setRefreshTrigger(prev => prev + 1)
        handleCloseModal()
      } else {
        setModalError(response.message || t('decks.errorCommon'))
      }
    } catch (err) {
      setModalError(err.response?.data?.message || t('decks.errorSystem'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDeck = (deckId) => {
    setDeletingDeckId(deckId)
    setIsConfirmOpen(true)
  }

  const executeDeleteDeck = async () => {
    if (!deletingDeckId) return
    try {
      const response = await deleteUserDeck(deletingDeckId)
      if (response.success) {
        setRefreshTrigger(prev => prev + 1)
      } else {
        setError(response.message || t('decks.deleteFailed'))
      }
    } catch (err) {
      setError(t('decks.deleteSystemError'))
    } finally {
      setIsConfirmOpen(false)
      setDeletingDeckId(null)
    }
  }

  const handleCancelDelete = () => {
    setIsConfirmOpen(false)
    setDeletingDeckId(null)
  }

  return (
    <div className="decks-container">
      {/* Tab chuyển đổi */}
      <div className="decks-tabs-wrapper">
        <button
          className={`deck-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          {t('decks.systemTab')}
        </button>
        <button
          className={`deck-tab-btn ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          {t('decks.userTab')}
        </button>
      </div>

      {/* Nút Tạo bộ từ mới (chỉ hiện ở tab bộ từ cá nhân) */}
      {activeTab === 'user' && (
        <div className="deck-action-section">
          <button className="deck-create-btn" onClick={openCreateModal}>
            <svg className="deck-create-icon" viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
            </svg>
            {t('decks.createBtn')}
          </button>
        </div>
      )}

      {/* Ô tìm kiếm và Bộ lọc (Chỉ hiển thị khi chọn tab Bộ từ hệ thống) */}
      {activeTab === 'system' && (
        <>
          {/* Ô tìm kiếm */}
          <div className="deck-search-section">
            <div className="deck-search-bar-wrapper">
              <svg className="deck-search-icon" viewBox="0 0 24 24" width="20" height="20">
                <path
                  d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                  fill="currentColor"
                />
              </svg>
              <input
                type="text"
                className="deck-search-input"
                placeholder={t('decks.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Bộ lọc */}
          <Filters
            cefrLevels={cefrLevels}
            tags={tags}
            selectedCefrLevelId={selectedCefrLevelId}
            selectedTagId={selectedTagId}
            onCefrChange={handleCefrClick}
            onTagChange={handleTagClick}
          />
        </>
      )}

      {/* Danh sách Bộ từ */}
      {loading ? (
        <div className="decks-loading">
          <div className="deck-spinner"></div>
          <p>{t('decks.loading')}</p>
        </div>
      ) : error ? (
        <div className="decks-error">
          <p>{error}</p>
        </div>
      ) : decks.length === 0 ? (
        <div className="decks-empty">
          <p>
            {activeTab === 'system'
              ? t('decks.emptySystem')
              : t('decks.emptyUser')}
          </p>
        </div>
      ) : (
        <div className="decks-grid">
          {activeTab === 'system' ? (
            decks.map((deck) => (
              <DeckCard
                key={deck._id}
                deck={deck}
                cefrLevels={cefrLevels}
                tags={tags}
                onClick={handleDeckClick}
              />
            ))
          ) : (
            decks.map((deck) => (
              <UserDeckCard
                key={deck._id}
                deck={deck}
                onLearn={handleDeckClick}
                onEdit={(d) => onNavigate(`/profile/decks/${d._id}`)}
                onDelete={handleDeleteDeck}
              />
            ))
          )}
        </div>
      )}

      {/* Thanh Phân trang */}
      {!loading && !error && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}

      {/* Modal Tạo/Sửa Bộ từ */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? t('decks.modalCreateTitle') : t('decks.modalEditTitle')}
              </h3>
              <button className="modal-close-icon-btn" onClick={handleCloseModal} aria-label="Close">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {modalError && <div className="modal-error-message">{modalError}</div>}
                <Input
                  id="deck-title"
                  label={t('decks.labelTitle')}
                  type="text"
                  placeholder={t('decks.placeholderTitle')}
                  value={modalTitle}
                  onChange={(e) => {
                    setModalTitle(e.target.value)
                    e.target.setCustomValidity('')
                  }}
                  onInvalid={(e) => e.target.setCustomValidity(t('decks.errorTitleRequired'))}
                  maxLength={100}
                  required
                />
                <div className="form-group">
                  <label htmlFor="deck-desc" className="form-label">{t('decks.labelDesc')}</label>
                  <textarea
                    id="deck-desc"
                    className="form-textarea"
                    value={modalDesc}
                    onChange={(e) => setModalDesc(e.target.value)}
                    placeholder={t('decks.placeholderDesc')}
                    maxLength={500}
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-cancel-btn" onClick={handleCloseModal} disabled={isSubmitting}>
                  {t('decks.cancelBtn')}
                </button>
                <button type="submit" className="modal-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? t('decks.processing') : (modalMode === 'create' ? t('decks.createSubmitBtn') : t('decks.saveSubmitBtn'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Modal Xóa Bộ từ */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={t('decks.deleteDeckTooltip')}
        message={t('decks.confirmDelete')}
        confirmText={t('decks.deleteDeckTooltip')}
        cancelText={t('decks.cancelBtn')}
        onConfirm={executeDeleteDeck}
        onCancel={handleCancelDelete}
        isDanger={true}
      />
    </div>
  )
}

export default DeckListPage
