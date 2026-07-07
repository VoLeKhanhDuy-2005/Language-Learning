import './DeckCard.css'
import { useTranslation } from 'react-i18next'

function DeckCard({ deck, cefrLevels = [], tags = [], onClick }) {
  const { t } = useTranslation()

  // Lấy nhãn CEFR
  const cefrLabels = deck.cefrLevelIds?.map(id => {
    const level = cefrLevels.find(l => l._id === id)
    if (!level) return null
    return level.label || level.code || ''
  }).filter(Boolean) || []

  // Lấy nhãn Tags
  const tagLabels = deck.tagIds?.map(id => {
    const tag = tags.find(t => t._id === id)
    return tag ? tag.label : null
  }).filter(Boolean) || []

  // Ảnh fallback ngẫu nhiên dựa trên hash ID bộ từ
  const fallbackColors = [
    '#224e5a', // Lam đậm
    '#31473a', // Lục tối
    '#503a3a', // Nâu tối
  ]
  const colorIndex = deck._id ? deck._id.charCodeAt(deck._id.length - 1) % fallbackColors.length : 0
  const fallbackColor = fallbackColors[colorIndex]

  return (
    <div className="deck-card" onClick={() => onClick && onClick(deck._id)}>
      {/* Container Ảnh */}
      <div
        className="deck-card-image-container"
        style={{ backgroundColor: deck.coverImage ? 'transparent' : fallbackColor }}
      >
        {deck.coverImage ? (
          <img src={deck.coverImage} alt={deck.title} className="deck-card-image" />
        ) : (
          <div className="deck-card-image-placeholder"></div>
        )}

        {/* Số từ */}
        <div className="deck-card-word-badge">
          <svg className="deck-card-word-icon" viewBox="0 0 24 24" width="14" height="14">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" fill="currentColor" />
          </svg>
          <span>{deck.cardCount || 0} {t('deckDetail.wordsCount')}</span>
        </div>
      </div>

      {/* Nội dung Card */}
      <div className="deck-card-content">
        <div className="deck-card-meta">
          {cefrLabels.map((lbl, idx) => (
            <span key={idx} className="deck-meta-badge cefr-badge">
              {lbl}
            </span>
          ))}
          {tagLabels.map((lbl, idx) => (
            <span key={idx} className="deck-meta-badge tag-badge">
              {lbl}
            </span>
          ))}
        </div>
        <h3 className="deck-card-title">{deck.title}</h3>
        <p className="deck-card-description">{deck.description}</p>
      </div>
    </div>
  )
}

export default DeckCard
