import './LessonCard.css'

function LessonCard({ lesson, userProgress, cefrLevels = [], tags = [], onClick }) {
  const hasDictation = lesson.modes?.includes('dictation')
  const hasShadowing = lesson.modes?.includes('shadowing')

  // Lấy danh sách trình độ CEFR của bài học
  const lessonCefrLevels = (lesson.cefrLevelIds || [])
    .map(id => cefrLevels.find(level => level._id === id))
    .filter(Boolean)

  // Lấy danh sách tag chủ đề của bài học
  const lessonTags = (lesson.tagIds || [])
    .map(id => tags.find(tag => tag._id === id))
    .filter(Boolean)

  const getModeClass = (mode) => {
    if (!userProgress) return ''
    const status = userProgress[mode]?.status
    if (status === 'in_progress') return 'status-in-progress'
    if (status === 'completed') return 'status-completed'
    return ''
  }

  // Một số màu sắc trơn đại diện tinh tế nếu bài học không có ảnh thumbnail
  const fallbackColors = [
    '#eae7e7', // Xám nhạt
    '#e5e2e1', // Xám ấm
    '#224e5a', // Lam đậm đặc biệt
    '#31473a', // Lục tối đặc biệt
    '#503a3a', // Nâu tối
  ]
  // Chọn màu dựa trên mã hash đơn giản của ID bài học để màu sắc cố định cho từng bài
  const colorIndex = lesson._id ? lesson._id.charCodeAt(lesson._id.length - 1) % fallbackColors.length : 0
  const blockColor = fallbackColors[colorIndex]

  return (
    <div className="lesson-card" onClick={() => onClick && onClick(lesson._id)}>
      {/* Phần Thumbnail */}
      <div
        className="lesson-card-thumbnail"
        style={{
          backgroundColor: lesson.thumbnailUrl ? 'transparent' : blockColor,
        }}
      >
        {lesson.thumbnailUrl ? (
          <img
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            className="lesson-thumbnail-img"
          />
        ) : (
          <div className="lesson-thumbnail-placeholder"></div>
        )}
      </div>

      {/* Phần Nội dung */}
      <div className="lesson-card-body">
        {/* Các tag cấp độ và chủ đề */}
        {(lessonCefrLevels.length > 0 || lessonTags.length > 0) && (
          <div className="lesson-card-tags">
            {lessonCefrLevels.map(level => (
              <span key={level._id} className="lesson-tag level-tag">
                {level.code}
              </span>
            ))}
            {lessonTags.map(tag => (
              <span key={tag._id} className="lesson-tag topic-tag">
                {tag.label}
              </span>
            ))}
          </div>
        )}

        <h3 className="lesson-card-title">{lesson.title}</h3>
        <p className="lesson-card-desc">{lesson.description}</p>
        
        {/* Chân card hiển thị chế độ */}
        <div className="lesson-card-footer">
          {hasDictation && (
            <span className={`mode-badge ${getModeClass('dictation')}`}>
              <svg className="mode-icon" viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
                  fill="currentColor"
                />
              </svg>
              Dictation
            </span>
          )}
          {hasShadowing && (
            <span className={`mode-badge ${getModeClass('shadowing')}`}>
              <svg className="mode-icon" viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.2 6 6.72V21h2v-3.28c3.28-.48 6-3.26 6-6.72h-1.7z"
                  fill="currentColor"
                />
              </svg>
              Shadowing
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default LessonCard
