import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getUserDueCardStates, patchCardState } from '../flashcardsApi'
import Pagination from '../../../components/Pagination/Pagination'
import './SavedCardsPage.css'

function SavedCardsPage({ onNavigate }) {
  const { t, i18n } = useTranslation()
  const [savedItems, setSavedItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const limit = 9 // Mỗi trang hiển thị 9 từ đã lưu

  const fetchSavedCards = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getUserDueCardStates({ hidden: false, starred: true, page, limit })
      if (response.success) {
        setSavedItems(response.data || [])
        setTotalPages(response.pagination?.totalPages || 1)
      } else {
        setError(response.message || t('saved.errorLoad'))
      }
    } catch (err) {
      console.error('Lỗi khi tải từ đã lưu:', err)
      setError(t('saved.errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  // Tải dữ liệu khi thay đổi trang
  useEffect(() => {
    fetchSavedCards()
  }, [page])

  // Click unstar
  const handleUnstar = async (item) => {
    try {
      const response = await patchCardState(item.cardId._id || item.cardId, {
        deckId: item.deckId,
        topicId: item.topicId,
        flags: {
          starred: false,
          hidden: item.flags?.hidden || false
        }
      })
      if (response.success) {
        // Cập nhật local state
        const updatedList = savedItems.filter(i => i._id !== item._id)
        setSavedItems(updatedList)

        // Nếu trang hiện tại không còn phần tử nào và page > 1, lùi trang
        if (updatedList.length === 0 && page > 1) {
          setPage(page - 1)
        } else {
          // Tải lại dữ liệu để lấy từ của trang tiếp theo đắp vào (nếu có)
          fetchSavedCards()
        }
      } else {
        setError(response.message || t('api.common.UNKNOWN_ERROR'))
      }
    } catch (err) {
      console.error('Lỗi khi unstar từ vựng:', err)
      setError(t('api.common.UNKNOWN_ERROR'))
    }
  }

  // Phát âm thanh
  const handleAudioPlay = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch((err) => console.error('Lỗi phát âm thanh:', err))
    }
  }

  const currentLang = i18n.language === 'vi' ? 'vi' : 'en'

  return (
    <div className="saved-cards-container">
      <div className="saved-cards-header">
        <h1 className="saved-cards-title">{t('saved.title')}</h1>
      </div>

      {loading ? (
        <div className="saved-cards-loading">
          <div className="saved-cards-spinner"></div>
          <p>{t('decks.loading')}</p>
        </div>
      ) : error ? (
        <div className="saved-cards-error">
          <p>{error}</p>
        </div>
      ) : savedItems.length === 0 ? (
        <div className="saved-cards-empty">
          <p>{t('saved.empty')}</p>
        </div>
      ) : (
        <>
          <div className="saved-cards-grid">
            {savedItems.map((item) => {
              const card = item.cardId || {}
              const explanationText = card.explanation?.[currentLang] || card.explanation?.vi || card.explanation?.en || ''

              // Lấy audio US/UK
              const ukPhonetic = card.phonetics?.find(p => p.locale?.toLowerCase().includes('uk') || p.locale?.toLowerCase().includes('gb'))
              const usPhonetic = card.phonetics?.find(p => p.locale?.toLowerCase().includes('us'))

              return (
                <div key={item._id} className="saved-card-item">
                  {/* Nút unstar thùng rác ở góc phải */}
                  <button
                    className="saved-card-unstar-btn"
                    onClick={() => handleUnstar(item)}
                    title="Bỏ lưu"
                    aria-label="Remove word"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>

                  {/* Từ vựng chính */}
                  <h2 className="saved-card-term">{card.term}</h2>

                  {/* Phát âm loa và IPA */}
                  <div className="saved-card-phonetics-section">
                    <div className="saved-card-audio-row">
                      {ukPhonetic?.audio && (
                        <button
                          className="saved-card-speaker-btn"
                          onClick={() => handleAudioPlay(ukPhonetic.audio)}
                          title="UK Pronunciation"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                          <span>UK</span>
                        </button>
                      )}
                      {usPhonetic?.audio && (
                        <button
                          className="saved-card-speaker-btn"
                          onClick={() => handleAudioPlay(usPhonetic.audio)}
                          title="US Pronunciation"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                          <span>US</span>
                        </button>
                      )}
                    </div>

                    <div className="saved-card-ipa-row">
                      {ukPhonetic?.text && (
                        <span className="saved-card-ipa">UK <span className="ipa-text">{ukPhonetic.text}</span></span>
                      )}
                      {usPhonetic?.text && (
                        <span className="saved-card-ipa">US <span className="ipa-text">{usPhonetic.text}</span></span>
                      )}
                    </div>
                  </div>

                  {/* Loại từ (pos) */}
                  {card.pos && (
                    <div className="saved-card-pos-badge">
                      {card.pos}
                    </div>
                  )}

                  {/* Nghĩa & Giải thích */}
                  <div className="saved-card-meaning-section">
                    <h3 className="saved-card-translation">{card.translation}</h3>
                    {explanationText && (
                      <p className="saved-card-explanation">{explanationText}</p>
                    )}
                  </div>

                  {/* Ví dụ ngăn cách bằng đường kẻ nét đứt */}
                  {(card.examples?.en || card.examples?.vi) && (
                    <div className="saved-card-examples-section">
                      {card.examples?.en && (
                        <p className="saved-example-en">{card.examples.en}</p>
                      )}
                      {card.examples?.vi && (
                        <p className="saved-example-vi">{card.examples.vi}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}

export default SavedCardsPage
