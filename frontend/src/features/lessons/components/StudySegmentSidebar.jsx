import React from 'react'
import { useTranslation } from 'react-i18next'
import './StudySegmentSidebar.css'

const StudySegmentSidebar = ({ segments = [], currentSegmentIndex, onSelectSegment, mode = 'dictation' }) => {
  const { t } = useTranslation()

  if (!segments || segments.length === 0) return null

  // Tính toán tiến độ dựa trên chế độ (dictation hoặc shadowing)
  const completedSegmentsCount = segments.filter(
    (item) => item.userProgress && item.userProgress[mode]
  ).length
  
  const lessonProgressPct = Math.round((completedSegmentsCount / segments.length) * 100)

  // Tìm index của segment chưa hoàn thành đầu tiên để khóa các segment phía sau
  const firstIncompleteIdx = segments.findIndex(
    (item) => !item.userProgress || !item.userProgress[mode]
  )

  const handleSelect = (idx) => {
    // Chỉ cho phép chọn các segment đã mở khóa
    const maxSelectableIdx = firstIncompleteIdx === -1 ? segments.length - 1 : firstIncompleteIdx
    if (idx <= maxSelectableIdx && onSelectSegment) {
      onSelectSegment(idx)
    }
  }

  return (
    <aside className="study-sidebar-aside">
      <div className="progress-list-card">
        
        {/* Thanh tiến độ tổng quan */}
        <div className="right-progress-header">
          <span className="progress-title">{t(`${mode}.progressTitle`)}</span>
          <span className="progress-pct-value">{lessonProgressPct}%</span>
        </div>
        <div className="right-progress-bar-container">
          <div className="right-progress-bar-fill" style={{ width: `${lessonProgressPct}%` }}></div>
        </div>

        {/* Danh sách các segment */}
        <div className="sidebar-segments-scroller">
          {segments.map((item, idx) => {
            const isSelected = idx === currentSegmentIndex
            const isFinished = !!(item.userProgress && item.userProgress[mode])
            const score = item.userProgress?.[mode]?.bestScore

            // Quyết định khóa/mở khóa segment tiếp theo
            const isLocked = firstIncompleteIdx !== -1 && idx > firstIncompleteIdx

            let segmentStateClass = ''
            if (isSelected) segmentStateClass = 'state-studying'
            else if (isFinished) segmentStateClass = 'state-completed'
            else if (isLocked) segmentStateClass = 'state-locked'

            return (
              <button
                key={item.segment._id}
                onClick={() => !isLocked && handleSelect(idx)}
                className={`segment-sidebar-card ${segmentStateClass} ${isLocked ? 'disabled' : ''}`}
                disabled={isLocked}
              >
                <div className="segment-card-header-row">
                  <span className="segment-order-number">{String(idx + 1).padStart(2, '0')}</span>

                  {/* Hiển thị điểm số / badge trạng thái */}
                  {isFinished && score !== undefined && score !== null ? (
                    <span className={`segment-score-badge ${score < 50 ? 'score-red' : score < 80 ? 'score-yellow' : 'score-green'}`}>
                      {Math.round(score)}
                    </span>
                  ) : isSelected ? (
                    <span className="status-badge-icon studying" title="Studying">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </span>
                  ) : isLocked ? (
                    <span className="status-badge-icon locked" title="Locked">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                  ) : null}
                </div>

                <div className="segment-card-preview-body">
                  {isFinished ? (
                    <p className="segment-text-preview">{item.segment.transcript.original}</p>
                  ) : (
                    <div className="segment-text-mask-placeholder">
                      {'-'.repeat(30)}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

      </div>
    </aside>
  )
}

export default StudySegmentSidebar
