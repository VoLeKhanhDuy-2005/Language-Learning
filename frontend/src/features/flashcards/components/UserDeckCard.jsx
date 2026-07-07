import { useTranslation } from 'react-i18next'
import './UserDeckCard.css'

function UserDeckCard({ deck, onLearn, onEdit, onDelete }) {
  const { t } = useTranslation()

  const handleEditClick = (e) => {
    e.stopPropagation()
    if (onEdit) onEdit(deck)
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    if (onDelete) onDelete(deck._id)
  }

  return (
    <div className="user-deck-card" onClick={() => onLearn && onLearn(deck._id)}>
      <div className="user-deck-card-content">
        <h3 className="user-deck-card-title">{deck.title}</h3>
        <p className="user-deck-card-description">
          {deck.description || t('decks.emptyDesc')}
        </p>
      </div>
      <div className="user-deck-card-divider"></div>
      <div className="user-deck-card-footer">
        {/* Số lượng từ */}
        <div className="user-deck-card-word-count">
          <svg className="user-deck-card-word-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
          </svg>
          <span>{deck.cardCount || 0} {t('deckDetail.wordsCount')}</span>
        </div>

        <div className="user-deck-card-actions">
          <button className="user-deck-btn-action btn-edit" onClick={handleEditClick} title={t('decks.editDeckTooltip')}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="user-deck-btn-action btn-delete" onClick={handleDeleteClick} title={t('decks.deleteDeckTooltip')}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserDeckCard
