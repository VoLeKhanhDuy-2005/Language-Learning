import { useTranslation } from 'react-i18next'
import './Filters.css'

function Filters({
  cefrLevels = [],
  tags = [],
  selectedCefrLevelId = null,
  selectedTagId = null,
  onCefrChange,
  onTagChange
}) {
  const { t } = useTranslation()
  return (
    <div className="filters-wrapper">
      {/* Lọc Trình độ */}
      {cefrLevels.length > 0 && (
        <div className="filter-group">
          <span className="filter-label">{t('filters.level')}</span>
          <div className="filter-options">
            {cefrLevels.map((level) => (
              <button
                key={level._id}
                className={`filter-btn cefr-btn ${selectedCefrLevelId === level._id ? 'active' : ''}`}
                onClick={() => onCefrChange && onCefrChange(level._id)}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lọc Chủ đề */}
      {tags.length > 0 && (
        <div className="filter-group">
          <span className="filter-label">{t('filters.topic')}</span>
          <div className="filter-options tags-options">
            <button
              className={`filter-btn tag-btn ${selectedTagId === null ? 'active' : ''}`}
              onClick={() => onTagChange && onTagChange(null)}
            >
              {t('filters.all')}
            </button>
            {tags.map((tag) => (
              <button
                key={tag._id}
                className={`filter-btn tag-btn ${selectedTagId === tag._id ? 'active' : ''}`}
                onClick={() => onTagChange && onTagChange(tag._id)}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Filters
