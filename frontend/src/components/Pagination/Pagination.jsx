import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './Pagination.css'

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation()
  const [editingEllipsis, setEditingEllipsis] = useState(null) // 'start' | 'end' | null
  const [jumpPageVal, setJumpPageVal] = useState('')

  const handleJumpPage = () => {
    const pageNum = parseInt(jumpPageVal, 10)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum)
    }
    setEditingEllipsis(null)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxPageButtons = 5
    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      if (currentPage <= 3) {
        end = 4
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3
      }
      if (start > 2) {
        pages.push('ellipsis-start')
      }
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      if (end < totalPages - 1) {
        pages.push('ellipsis-end')
      }
      pages.push(totalPages)
    }
    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="minlish-pagination-container">
      <button 
        className={`minlish-pagination-btn minlish-nav-btn ${currentPage === 1 ? 'disabled' : ''}`}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous Page"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
            fill="currentColor"
          />
        </svg>
      </button>

      {getPageNumbers().map((p, idx) => {
        if (p === 'ellipsis-start' || p === 'ellipsis-end') {
          const isStart = p === 'ellipsis-start'
          const isEditing = editingEllipsis === (isStart ? 'start' : 'end')

          if (isEditing) {
            return (
              <input
                key={`ellipsis-input-${idx}`}
                type="number"
                className="minlish-pagination-input"
                min={1}
                max={totalPages}
                value={jumpPageVal}
                onChange={(e) => setJumpPageVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJumpPage()
                  } else if (e.key === 'Escape') {
                    setEditingEllipsis(null)
                  }
                }}
                onBlur={handleJumpPage}
                autoFocus
                placeholder="..."
              />
            )
          }

          return (
            <button
              key={`ellipsis-${idx}`}
              className="minlish-pagination-ellipsis-btn"
              onClick={() => {
                setEditingEllipsis(isStart ? 'start' : 'end')
                setJumpPageVal('')
              }}
              title={t('pagination.jumpToPage')}
              aria-label={t('pagination.jumpToPage')}
            >
              ...
            </button>
          )
        }
        return (
          <button
            key={p}
            className={`minlish-pagination-btn minlish-num-btn ${currentPage === p ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      })}

      <button 
        className={`minlish-pagination-btn minlish-nav-btn ${currentPage === totalPages ? 'disabled' : ''}`}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next Page"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  )
}

export default Pagination
