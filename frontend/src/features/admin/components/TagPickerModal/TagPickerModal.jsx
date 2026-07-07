import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createTagApi, updateTagApi, deleteTagApi } from '../../adminApi'
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal'
import './TagPickerModal.css'

function TagPickerModal({
  isOpen,
  onClose,
  availableTags,
  selectedTags,
  onApply,
  onTagsChange,
}) {
  const { t } = useTranslation()
  const [localSelected, setLocalSelected] = useState([])
  const [newTagLabel, setNewTagLabel] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTagId, setEditingTagId] = useState(null)
  const [editingTagLabel, setEditingTagLabel] = useState('')
  const [deletingTagId, setDeletingTagId] = useState(null)

  // Internal CRUD states
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [createTagError, setCreateTagError] = useState('')
  const [isUpdatingTag, setIsUpdatingTag] = useState(false)
  const [isDeletingTag, setIsDeletingTag] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLocalSelected([...selectedTags])
      setNewTagLabel('')
      setIsCreatingNew(false)
      setSearchQuery('')
      setEditingTagId(null)
      setEditingTagLabel('')
      setDeletingTagId(null)
      setCreateTagError('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleToggleTag = (tag) => {
    setLocalSelected((prev) => {
      const exists = prev.find((t) => t._id === tag._id)
      if (exists) {
        return prev.filter((t) => t._id !== tag._id)
      }
      return [...prev, tag]
    })
  }

  const handleApply = () => {
    onApply(localSelected)
    onClose()
  }

  // Lọc tags theo search query
  const filteredTags = availableTags.filter((tag) =>
    tag.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateNewClick = async () => {
    if (!newTagLabel.trim() || isCreatingTag) return
    setIsCreatingTag(true)
    setCreateTagError('')
    try {
      const response = await createTagApi(newTagLabel.trim())
      if (response.success && response.data) {
        const newTag = response.data
        // Cập nhật danh sách available tags ở parent
        const updatedTags = [...availableTags, newTag]
        if (onTagsChange) onTagsChange(updatedTags)
        // Tự động chọn tag mới tạo
        setLocalSelected((prev) => [...prev, newTag])
        setNewTagLabel('')
        setIsCreatingNew(false)
      } else {
        setCreateTagError(response.message)
      }
    } catch (error) {
      setCreateTagError(error.response?.data?.message || error.message)
    } finally {
      setIsCreatingTag(false)
    }
  }

  const handleStartEdit = (tag) => {
    setEditingTagId(tag._id)
    setEditingTagLabel(tag.label)
  }

  const handleCancelEdit = () => {
    setEditingTagId(null)
    setEditingTagLabel('')
  }

  const handleSaveEdit = async () => {
    if (!editingTagLabel.trim() || !editingTagId || isUpdatingTag) return
    setIsUpdatingTag(true)
    try {
      const response = await updateTagApi(editingTagId, editingTagLabel.trim())
      if (response.success && response.data) {
        const updatedTag = response.data
        // Cập nhật danh sách available tags ở parent
        const updatedTags = availableTags.map((t) =>
          t._id === updatedTag._id ? updatedTag : t
        )
        if (onTagsChange) onTagsChange(updatedTags)
        // Cập nhật tag trong localSelected nếu đang được chọn
        setLocalSelected((prev) =>
          prev.map((t) => (t._id === updatedTag._id ? updatedTag : t))
        )
        setEditingTagId(null)
        setEditingTagLabel('')
      }
    } finally {
      setIsUpdatingTag(false)
    }
  }

  const handleDeleteClick = (tagId) => {
    setDeletingTagId(tagId)
  }

  const handleConfirmDelete = async () => {
    if (!deletingTagId || isDeletingTag) return
    setIsDeletingTag(true)
    try {
      const response = await deleteTagApi(deletingTagId)
      if (response.success) {
        // Cập nhật danh sách available tags ở parent
        const updatedTags = availableTags.filter((t) => t._id !== deletingTagId)
        if (onTagsChange) onTagsChange(updatedTags)
        // Xóa tag khỏi localSelected nếu đang được chọn
        setLocalSelected((prev) => prev.filter((t) => t._id !== deletingTagId))
        setDeletingTagId(null)
      }
    } finally {
      setIsDeletingTag(false)
    }
  }

  const handleCancelDelete = () => {
    setDeletingTagId(null)
  }

  if (!isOpen) return null

  return (
    <div className="tag-modal-overlay" onClick={onClose}>
      <div className="tag-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tag-modal-header">
          <h3 className="tag-modal-title">{t('admin.tagPickerTitle')}</h3>
          <button className="tag-modal-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="tag-modal-body">
          {/* Create New Tag Section */}
          {!isCreatingNew ? (
            <button className="tag-modal-create-btn" onClick={() => setIsCreatingNew(true)}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{t('admin.createNewTag')}</span>
            </button>
          ) : (
            <div className="tag-modal-create-form">
              <input
                type="text"
                className="tag-modal-new-input"
                placeholder={t('admin.newTagPlaceholder')}
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreatingTag) handleCreateNewClick()
                  if (e.key === 'Escape') {
                    setIsCreatingNew(false)
                    setNewTagLabel('')
                  }
                }}
                disabled={isCreatingTag}
                autoFocus
              />
              <div className="tag-modal-create-actions">
                <button
                  className="tag-modal-create-confirm"
                  onClick={handleCreateNewClick}
                  disabled={!newTagLabel.trim() || isCreatingTag}
                >
                  {isCreatingTag ? (
                    <div className="tag-modal-spinner"></div>
                  ) : (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <button
                  className="tag-modal-create-cancel"
                  onClick={() => {
                    setIsCreatingNew(false)
                    setNewTagLabel('')
                  }}
                  disabled={isCreatingTag}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {createTagError && <div className="tag-modal-error">{createTagError}</div>}

          {/* Search Bar */}
          <div className="tag-modal-search">
            <svg className="tag-modal-search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="tag-modal-search-input"
              placeholder={t('admin.searchTagPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="tag-modal-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Available Tags List */}
          <div className="tag-modal-list">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => {
                const isSelected = localSelected.find((t) => t._id === tag._id)
                const isEditing = editingTagId === tag._id

                return (
                  <div key={tag._id} className="tag-modal-item-wrapper">
                    {isEditing ? (
                      // Edit Mode
                      <div className="tag-modal-item-edit">
                        <input
                          type="text"
                          className="tag-modal-edit-input"
                          value={editingTagLabel}
                          onChange={(e) => setEditingTagLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit()
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                          disabled={isUpdatingTag}
                          autoFocus
                        />
                        <div className="tag-modal-edit-actions">
                          <button
                            className="tag-modal-edit-save"
                            onClick={handleSaveEdit}
                            disabled={!editingTagLabel.trim() || isUpdatingTag}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <button
                            className="tag-modal-edit-cancel"
                            onClick={handleCancelEdit}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal Mode
                      <label className="tag-modal-item">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => handleToggleTag(tag)}
                          className="tag-modal-checkbox"
                        />
                        <span className="tag-modal-checkmark">
                          {isSelected && (
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className="tag-modal-label">{tag.label}</span>
                        <div className="tag-modal-item-actions">
                          <button
                            className="tag-modal-action-btn edit"
                            onClick={(e) => {
                              e.preventDefault()
                              handleStartEdit(tag)
                            }}
                            title={t('admin.editTag')}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="tag-modal-action-btn delete"
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeleteClick(tag._id)
                            }}
                            title={t('admin.deleteTag')}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </label>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="tag-modal-empty">
                {searchQuery ? t('admin.noTagsFound') : t('admin.noTagsAvailable')}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="tag-modal-footer">
          <button className="tag-modal-cancel" onClick={onClose}>
            {t('admin.cancelBtn')}
          </button>
          <button className="tag-modal-apply" onClick={handleApply}>
            {t('admin.applyBtn')} ({localSelected.length})
          </button>
        </div>
      </div>

      {/* Delete Category Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingTagId !== null}
        title={t('admin.confirmDeleteTagTitle') || 'Xóa danh mục'}
        message={t('admin.confirmDeleteTag') || 'Xác nhận xóa danh mục này?'}
        confirmText={t('admin.deleteBtn')}
        cancelText={t('admin.cancelBtn')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDanger={true}
      />
    </div>
  )
}

export default TagPickerModal
