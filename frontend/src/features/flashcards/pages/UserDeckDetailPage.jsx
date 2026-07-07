import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getUserDeckDetail,
  updateUserDeck,
  getUserDeckTopics,
  createUserTopic,
  updateUserTopic,
  deleteUserTopic,
  getUserTopicCards,
  createUserCard,
  updateUserCard,
  deleteUserCard,
  searchSystemVocabulary
} from '../flashcardsApi'
import Input from '../../../components/Input/Input'
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal'
import ImportExportModal from '../components/ImportExportModal'
import './UserDeckDetailPage.css'

const POS_OPTIONS = [
  'adjective',
  'adverb',
  'auxiliary verb',
  'collocation',
  'conjunction',
  'determiner',
  'idiom',
  'interjection',
  'modal verb',
  'noun',
  'phrasal verb',
  'phrase',
  'preposition',
  'pronoun',
  'verb'
]

function UserDeckDetailPage({ deckId, onNavigate }) {
  const { t } = useTranslation()
  const [deck, setDeck] = useState(null)
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [cards, setCards] = useState([])

  // Loading & error states
  const [loadingDeck, setLoadingDeck] = useState(true)
  const [loadingCards, setLoadingCards] = useState(false)
  const [error, setError] = useState('')

  // States cho modal sửa bộ từ
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false)
  const [deckTitle, setDeckTitle] = useState('')
  const [deckDesc, setDeckDesc] = useState('')
  const [deckError, setDeckError] = useState(null)
  const [isSubmittingDeck, setIsSubmittingDeck] = useState(false)

  // States cho modal chủ đề (topic)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false)
  const [topicModalMode, setTopicModalMode] = useState('create') // 'create' | 'edit'
  const [editingTopic, setEditingTopic] = useState(null)
  const [topicName, setTopicName] = useState('')
  const [topicError, setTopicError] = useState(null)
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false)

  // States cho modal thẻ (card)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [cardModalMode, setCardModalMode] = useState('create') // 'create' | 'edit'
  const [editingCard, setEditingCard] = useState(null)
  const [cardTerm, setCardTerm] = useState('')
  const [cardTranslation, setCardTranslation] = useState('')
  const [cardPos, setCardPos] = useState('')
  const [cardDefinition, setCardDefinition] = useState('')
  const [cardExample, setCardExample] = useState('')
  const [cardError, setCardError] = useState(null)
  const [isSubmittingCard, setIsSubmittingCard] = useState(false)
  const [cardModalTargetTopicId, setCardModalTargetTopicId] = useState(null)

  // States cho tìm kiếm từ vựng hệ thống điền nhanh
  const [vocabSearchQuery, setVocabSearchQuery] = useState('')
  const [vocabSearchResults, setVocabSearchResults] = useState([])
  const [isSearchingVocab, setIsSearchingVocab] = useState(false)

  // States cho ConfirmModal xóa
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmType, setConfirmType] = useState('deleteTopic') // 'deleteTopic' | 'deleteCard'
  const [targetDeleteId, setTargetDeleteId] = useState(null)

  // States cho modal Nhập/Xuất
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false)

  // 1. Tải thông tin chi tiết bộ từ và danh sách chủ đề
  const fetchDeckData = async (shouldSelectFirst = false) => {
    try {
      const deckRes = await getUserDeckDetail(deckId)
      if (deckRes.success) {
        setDeck(deckRes.data)
      }

      const topicsRes = await getUserDeckTopics(deckId)
      if (topicsRes.success) {
        const fetchedTopics = topicsRes.data.topics || []
        setTopics(fetchedTopics)

        if (fetchedTopics.length > 0) {
          if (shouldSelectFirst || !selectedTopic) {
            setSelectedTopic(fetchedTopics[0])
          } else {
            // Giữ chủ đề đang chọn và cập nhật tiến độ
            const currentSelected = fetchedTopics.find(
              (item) => item._id === selectedTopic?._id
            )
            if (currentSelected) {
              setSelectedTopic(currentSelected)
            } else {
              setSelectedTopic(fetchedTopics[0])
            }
          }
        } else {
          setSelectedTopic(null)
          setCards([])
        }
      }
    } catch (err) {
      console.error('Lỗi tải thông tin bộ từ:', err)
      setError(t('userDeckDetail.errorLoad'))
    } finally {
      setLoadingDeck(false)
    }
  }

  useEffect(() => {
    if (deckId) {
      setLoadingDeck(true)
      fetchDeckData(true)
    }
  }, [deckId])

  // 2. Tải danh sách thẻ của chủ đề đang chọn
  const fetchCards = async (topicId) => {
    setLoadingCards(true)
    try {
      const response = await getUserTopicCards(deckId, topicId)
      if (response.success) {
        setCards(response.data.cards || [])
      }
    } catch (err) {
      console.error('Lỗi tải thẻ từ vựng:', err)
    } finally {
      setLoadingCards(false)
    }
  }

  useEffect(() => {
    if (selectedTopic) {
      fetchCards(selectedTopic._id)
    }
  }, [selectedTopic])

  // Tự động tìm kiếm từ vựng hệ thống khi gõ có debounce
  useEffect(() => {
    if (!vocabSearchQuery.trim()) {
      setVocabSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingVocab(true)
      try {
        const res = await searchSystemVocabulary({ q: vocabSearchQuery, limit: 5 })
        if (res.success) {
          setVocabSearchResults(res.data || [])
        }
      } catch (err) {
        console.error('Lỗi tìm kiếm từ vựng hệ thống:', err)
      } finally {
        setIsSearchingVocab(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [vocabSearchQuery])

  const handleSelectSystemVocab = (item) => {
    setCardTerm(item.term || '')
    setCardTranslation(item.translation || '')
    setCardPos(item.pos || '')
    setCardDefinition(item.definition || '')
    setCardExample(item.example || '')
    setVocabSearchQuery('')
    setVocabSearchResults([])
  }

  const handleCloseCardModal = () => {
    setIsCardModalOpen(false)
    setVocabSearchQuery('')
    setVocabSearchResults([])
  }

  const handleBackClick = (e) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate('/decks', { tab: 'user' })
    }
  }

  // --- Bộ Từ (Deck) Modals ---
  const openDeckEditModal = () => {
    if (!deck) return
    setDeckTitle(deck.title || '')
    setDeckDesc(deck.description || '')
    setDeckError(null)
    setIsDeckModalOpen(true)
  }

  const handleDeckUpdateSubmit = async (e) => {
    e.preventDefault()
    if (!deckTitle.trim()) {
      setDeckError(t('decks.errorTitleRequired'))
      return
    }
    setIsSubmittingDeck(true)
    try {
      const res = await updateUserDeck(deckId, { title: deckTitle, description: deckDesc })
      if (res.success) {
        setDeck(res.data)
        setIsDeckModalOpen(false)
      } else {
        setDeckError(res.message || t('decks.errorCommon'))
      }
    } catch (err) {
      setDeckError(err.response?.data?.message || t('decks.errorSystem'))
    } finally {
      setIsSubmittingDeck(false)
    }
  }

  // --- Chủ đề (Topic) Modals ---
  const openCreateTopicModal = () => {
    setTopicModalMode('create')
    setEditingTopic(null)
    setTopicName('')
    setTopicError(null)
    setIsTopicModalOpen(true)
  }

  const openEditTopicModal = (e, topicObj) => {
    e.stopPropagation()
    setTopicModalMode('edit')
    setEditingTopic(topicObj)
    setTopicName(topicObj.name || '')
    setTopicError(null)
    setIsTopicModalOpen(true)
  }

  const handleTopicSubmit = async (e) => {
    e.preventDefault()
    if (!topicName.trim()) {
      setTopicError(t('userDeckDetail.errorTopicNameRequired'))
      return
    }
    setIsSubmittingTopic(true)
    try {
      let res
      if (topicModalMode === 'create') {
        res = await createUserTopic(deckId, { name: topicName })
      } else {
        res = await updateUserTopic(deckId, editingTopic._id, { name: topicName })
      }

      if (res.success) {
        setIsTopicModalOpen(false)
        await fetchDeckData()
      } else {
        setTopicError(res.message || t('decks.errorCommon'))
      }
    } catch (err) {
      setTopicError(err.response?.data?.message || t('decks.errorSystem'))
    } finally {
      setIsSubmittingTopic(false)
    }
  }

  const openDeleteTopicConfirm = (e, topicId) => {
    e.stopPropagation()
    setTargetDeleteId(topicId)
    setConfirmType('deleteTopic')
    setIsConfirmOpen(true)
  }

  // --- Thẻ (Card) Modals ---
  const openCreateCardModal = (targetTopicId) => {
    setCardModalMode('create')
    setCardModalTargetTopicId(targetTopicId)
    setEditingCard(null)
    setCardTerm('')
    setCardTranslation('')
    setCardPos('')
    setCardDefinition('')
    setCardExample('')
    setCardError(null)
    setVocabSearchQuery('')
    setVocabSearchResults([])
    setIsCardModalOpen(true)
  }

  const openEditCardModal = (cardObj) => {
    setCardModalMode('edit')
    setCardModalTargetTopicId(selectedTopic?._id)
    setEditingCard(cardObj)
    setCardTerm(cardObj.term || '')
    setCardTranslation(cardObj.translation || '')
    setCardPos(cardObj.pos || '')
    setCardDefinition(cardObj.explanation?.vi || '')
    setCardExample(cardObj.examples?.en || '')
    setCardError(null)
    setIsCardModalOpen(true)
  }

  const handleCardSubmit = async (e) => {
    e.preventDefault()
    if (!cardTerm.trim() || !cardTranslation.trim()) {
      setCardError(t('userDeckDetail.errorCardFieldsRequired'))
      return
    }
    setIsSubmittingCard(true)
    try {
      let res
      const payload = {
        term: cardTerm,
        translation: cardTranslation,
        pos: cardPos,
        definition: cardDefinition,
        example: cardExample
      }

      if (cardModalMode === 'create') {
        res = await createUserCard(deckId, {
          topicId: cardModalTargetTopicId,
          ...payload
        })
      } else {
        res = await updateUserCard(deckId, editingCard._id, payload)
      }

      if (res.success) {
        handleCloseCardModal()
        await fetchDeckData()
        if (selectedTopic && selectedTopic._id === cardModalTargetTopicId) {
          await fetchCards(selectedTopic._id)
        }
      } else {
        setCardError(res.message || t('decks.errorCommon'))
      }
    } catch (err) {
      setCardError(err.response?.data?.message || t('decks.errorSystem'))
    } finally {
      setIsSubmittingCard(false)
    }
  }

  const openDeleteCardConfirm = (cardId) => {
    setTargetDeleteId(cardId)
    setConfirmType('deleteCard')
    setIsConfirmOpen(true)
  }

  // --- Thực thi xóa bằng ConfirmModal ---
  const executeDelete = async () => {
    if (!targetDeleteId) return
    try {
      if (confirmType === 'deleteTopic') {
        const res = await deleteUserTopic(deckId, targetDeleteId)
        if (res.success) {
          // Nếu xóa trúng chủ đề đang được chọn, reset selection
          if (selectedTopic && selectedTopic._id === targetDeleteId) {
            setSelectedTopic(null)
            setCards([])
          }
          await fetchDeckData()
        } else {
          setError(res.message || t('userDeckDetail.deleteTopicFailed'))
        }
      } else {
        const res = await deleteUserCard(deckId, targetDeleteId)
        if (res.success) {
          await fetchDeckData()
          if (selectedTopic) {
            await fetchCards(selectedTopic._id)
          }
        } else {
          setError(res.message || t('userDeckDetail.deleteCardFailed'))
        }
      }
    } catch (err) {
      setError(t('decks.errorSystem'))
    } finally {
      setIsConfirmOpen(false)
      setTargetDeleteId(null)
    }
  }

  if (loadingDeck) {
    return (
      <div className="user-deck-detail-loading-screen">
        <div className="user-deck-detail-spinner"></div>
        <p>{t('userDeckDetail.loading')}</p>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="user-deck-detail-error-screen">
        <p className="error-text">{error || t('userDeckDetail.errorLoad')}</p>
        <button onClick={handleBackClick} className="btn-back">
          {t('deckDetail.backBtn')}
        </button>
      </div>
    )
  }

  // Tính tổng số thẻ
  const totalCardsCount = topics.reduce(
    (acc, item) => acc + (item.cardCount || 0),
    0
  )

  return (
    <div className="user-deck-detail-container">
      {/* Header và tiêu đề */}
      <div className="user-deck-detail-header-row">
        <div className="user-deck-detail-title-wrapper">
          <button onClick={handleBackClick} className="back-arrow-btn" aria-label="Go back">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="user-deck-title-group">
            <div className="user-deck-name-row">
              <h1 className="user-deck-detail-name">{deck.title}</h1>
              <button className="user-deck-btn-edit-deck" onClick={openDeckEditModal} title={t('userDeckDetail.editDeckTooltip')}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
            <div className="user-deck-meta-info">
              <span className="meta-item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                {t('userDeckDetail.cardsCount', { count: totalCardsCount })}
              </span>
              <span className="meta-item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                {t('userDeckDetail.topicsCount', { count: topics.length })}
              </span>
            </div>
          </div>
        </div>

        <button className="user-deck-btn-primary btn-create-topic" onClick={openCreateTopicModal}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('userDeckDetail.createTopicBtn')}
        </button>
      </div>

      {/* Grid danh sách Chủ đề (Topic) */}
      <div className="user-deck-topics-section">
        <div className="user-deck-topics-grid">
          {topics.map((item) => {
            const isSelected = selectedTopic?._id === item._id
            const cardCount = item.cardCount || 0
            return (
              <div key={item._id} className={`user-topic-card ${isSelected ? 'active' : ''}`}>
                <div className="user-topic-card-header">
                  <span className="user-topic-card-title">{item.name}</span>
                  <div className="user-topic-card-actions">
                    <button className="user-topic-btn-icon" onClick={(e) => openEditTopicModal(e, item)} title={t('userDeckDetail.editTopicTooltip')}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="user-topic-btn-icon btn-delete-topic" onClick={(e) => openDeleteTopicConfirm(e, item._id)} title={t('userDeckDetail.deleteTopicTooltip')}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="user-topic-card-body">
                  <span className="user-topic-card-cards-count">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    {t('userDeckDetail.cardsCount', { count: cardCount })}
                  </span>
                </div>

                <div className="user-topic-card-footer">
                  <button className="user-topic-btn-view-cards" onClick={() => setSelectedTopic(item)}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {t('userDeckDetail.viewCardsBtn')}
                  </button>
                  <button className="user-topic-btn-add-card" onClick={() => openCreateCardModal(item._id)}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t('userDeckDetail.createCardBtn')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Khu vực danh sách thẻ của Chủ đề được chọn */}
      {selectedTopic && (
        <div className="user-deck-cards-area">
          <div className="user-deck-cards-area-header">
            <h2 className="user-deck-cards-area-title">
              {t('userDeckDetail.cardsInTopic', { topicName: selectedTopic.name })}
            </h2>
            <div className="user-deck-cards-area-actions">
              <button 
                className="user-deck-btn-secondary btn-import-export" 
                onClick={() => setIsImportExportModalOpen(true)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {t('userDeckDetail.importExportBtn')}
              </button>
              <button className="user-deck-btn-primary btn-add-card-secondary" onClick={() => openCreateCardModal(selectedTopic._id)}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t('userDeckDetail.createCardBtn')}
              </button>
            </div>
          </div>

          {loadingCards ? (
            <div className="user-deck-cards-loading">
              <div className="user-deck-detail-spinner"></div>
            </div>
          ) : cards.length === 0 ? (
            <div className="user-deck-cards-empty">
              <p>{t('userDeckDetail.noWords')}</p>
            </div>
          ) : (
            <div className="user-deck-cards-grid">
              {cards.map((item) => (
                <div key={item._id} className="user-card-item">
                  <div className="user-card-item-header">
                    <div className="user-card-term-group">
                      <span className="user-card-term">{item.term}</span>
                      {item.pos && <span className="user-card-pos">({item.pos})</span>}
                    </div>
                    <div className="user-card-item-actions">
                      <button className="user-card-btn-action" onClick={() => openEditCardModal(item)} title={t('userDeckDetail.editCardTooltip')}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="user-card-btn-action btn-delete-card" onClick={() => openDeleteCardConfirm(item._id)} title={t('userDeckDetail.deleteCardTooltip')}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="user-card-item-body">
                    <div className="user-card-info-row">
                      <span className="info-label">{t('userDeckDetail.translationLabel')}</span>
                      <span className="info-val">{item.translation}</span>
                    </div>
                    {item.explanation?.vi && (
                      <div className="user-card-info-row">
                        <span className="info-label">{t('userDeckDetail.definitionLabel')}</span>
                        <span className="info-val">{item.explanation.vi}</span>
                      </div>
                    )}
                    {item.examples?.en && (
                      <div className="user-card-info-row">
                        <span className="info-label">{t('userDeckDetail.exampleLabel')}</span>
                        <span className="info-val italic">{item.examples.en}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Sửa Bộ từ */}
      {isDeckModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeckModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('userDeckDetail.editDeckTooltip')}</h3>
              <button className="modal-close-icon-btn" onClick={() => setIsDeckModalOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleDeckUpdateSubmit}>
              <div className="modal-body">
                {deckError && <div className="modal-error-message">{deckError}</div>}
                <Input
                  id="edit-deck-title"
                  label={t('decks.labelTitle')}
                  type="text"
                  placeholder={t('decks.placeholderTitle')}
                  value={deckTitle}
                  onChange={(e) => {
                    setDeckTitle(e.target.value)
                    e.target.setCustomValidity('')
                  }}
                  onInvalid={(e) => e.target.setCustomValidity(t('decks.errorTitleRequired'))}
                  maxLength={100}
                  required
                />
                <div className="form-group">
                  <label htmlFor="edit-deck-desc" className="form-label">{t('decks.labelDesc')}</label>
                  <textarea
                    id="edit-deck-desc"
                    className="form-textarea"
                    value={deckDesc}
                    onChange={(e) => setDeckDesc(e.target.value)}
                    placeholder={t('decks.placeholderDesc')}
                    maxLength={500}
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-cancel-btn" onClick={() => setIsDeckModalOpen(false)} disabled={isSubmittingDeck}>
                  {t('decks.cancelBtn')}
                </button>
                <button type="submit" className="modal-submit-btn" disabled={isSubmittingDeck}>
                  {isSubmittingDeck ? t('decks.processing') : t('decks.saveSubmitBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo/Sửa Chủ đề */}
      {isTopicModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTopicModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {topicModalMode === 'create' ? t('userDeckDetail.modalCreateTopicTitle') : t('userDeckDetail.modalEditTopicTitle')}
              </h3>
              <button className="modal-close-icon-btn" onClick={() => setIsTopicModalOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleTopicSubmit}>
              <div className="modal-body">
                {topicError && <div className="modal-error-message">{topicError}</div>}
                <Input
                  id="topic-name"
                  label={t('userDeckDetail.labelTopicName')}
                  type="text"
                  placeholder={t('userDeckDetail.placeholderTopicName')}
                  value={topicName}
                  onChange={(e) => {
                    setTopicName(e.target.value)
                    e.target.setCustomValidity('')
                  }}
                  onInvalid={(e) => e.target.setCustomValidity(t('userDeckDetail.errorTopicNameRequired'))}
                  maxLength={100}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-cancel-btn" onClick={() => setIsTopicModalOpen(false)} disabled={isSubmittingTopic}>
                  {t('decks.cancelBtn')}
                </button>
                <button type="submit" className="modal-submit-btn" disabled={isSubmittingTopic}>
                  {isSubmittingTopic ? t('decks.processing') : (topicModalMode === 'create' ? t('userDeckDetail.createTopicBtn') : t('decks.saveSubmitBtn'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo/Sửa Thẻ */}
      {isCardModalOpen && (
        <div className="modal-overlay" onClick={handleCloseCardModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {cardModalMode === 'create' ? t('userDeckDetail.modalCreateCardTitle') : t('userDeckDetail.modalEditCardTitle')}
              </h3>
              <button className="modal-close-icon-btn" onClick={handleCloseCardModal} aria-label="Close">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCardSubmit}>
              <div className="modal-body">
                {cardError && <div className="modal-error-message">{cardError}</div>}

                {cardModalMode === 'create' && (
                  <div className="vocab-search-container">
                    <Input
                      id="vocab-search-input"
                      label={t('userDeckDetail.labelSearchSystem')}
                      type="text"
                      placeholder={t('userDeckDetail.placeholderSearchSystem')}
                      value={vocabSearchQuery}
                      onChange={(e) => setVocabSearchQuery(e.target.value)}
                    />
                    {isSearchingVocab && <div className="vocab-search-loading">{t('userDeckDetail.searching')}</div>}
                    {vocabSearchResults.length > 0 && (
                      <ul className="vocab-search-results-list">
                        {vocabSearchResults.map((item) => (
                          <li
                            key={item.sourceCardId}
                            className="vocab-search-result-item"
                            onClick={() => handleSelectSystemVocab(item)}
                          >
                            <span className="result-term">{item.term}</span>
                            {item.pos && <span className="result-pos">({item.pos})</span>}
                            <span className="result-arrow">→</span>
                            <span className="result-translation">{item.translation}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <Input
                  id="card-term"
                  label={t('userDeckDetail.labelTerm')}
                  type="text"
                  placeholder={t('userDeckDetail.placeholderTerm')}
                  value={cardTerm}
                  onChange={(e) => {
                    setCardTerm(e.target.value)
                    e.target.setCustomValidity('')
                  }}
                  onInvalid={(e) => e.target.setCustomValidity(t('userDeckDetail.errorCardTermRequired'))}
                  maxLength={200}
                  required
                />
                <Input
                  id="card-translation"
                  label={t('userDeckDetail.labelTranslation')}
                  type="text"
                  placeholder={t('userDeckDetail.placeholderTranslation')}
                  value={cardTranslation}
                  onChange={(e) => {
                    setCardTranslation(e.target.value)
                    e.target.setCustomValidity('')
                  }}
                  onInvalid={(e) => e.target.setCustomValidity(t('userDeckDetail.errorCardTranslationRequired'))}
                  maxLength={500}
                  required
                />
                <div className="form-group">
                  <label htmlFor="card-pos" className="form-label">{t('userDeckDetail.labelPos')}</label>
                  <select
                    id="card-pos"
                    className="form-select"
                    value={cardPos}
                    onChange={(e) => setCardPos(e.target.value)}
                  >
                    <option value="">{t('userDeckDetail.placeholderPosSelect')}</option>
                    {POS_OPTIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="card-definition" className="form-label">{t('userDeckDetail.labelDefinition')}</label>
                  <textarea
                    id="card-definition"
                    className="form-textarea"
                    value={cardDefinition}
                    onChange={(e) => setCardDefinition(e.target.value)}
                    placeholder={t('userDeckDetail.placeholderDefinition')}
                    maxLength={1000}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="card-example" className="form-label">{t('userDeckDetail.labelExample')}</label>
                  <textarea
                    id="card-example"
                    className="form-textarea"
                    value={cardExample}
                    onChange={(e) => setCardExample(e.target.value)}
                    placeholder={t('userDeckDetail.placeholderExample')}
                    maxLength={1000}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-cancel-btn" onClick={handleCloseCardModal} disabled={isSubmittingCard}>
                  {t('decks.cancelBtn')}
                </button>
                <button type="submit" className="modal-submit-btn" disabled={isSubmittingCard}>
                  {isSubmittingCard ? t('decks.processing') : (cardModalMode === 'create' ? t('userDeckDetail.createCardBtn') : t('decks.saveSubmitBtn'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportExportModalOpen && selectedTopic && (
        <ImportExportModal
          deckId={deckId}
          topic={selectedTopic}
          onClose={() => setIsImportExportModalOpen(false)}
          onImportSuccess={() => {
            fetchCards(selectedTopic._id)
            fetchDeckData(false)
          }}
        />
      )}

      {/* ConfirmModal xóa Chủ đề hoặc Thẻ */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmType === 'deleteTopic' ? t('userDeckDetail.deleteTopicTooltip') : t('userDeckDetail.deleteCardTooltip')}
        message={confirmType === 'deleteTopic' ? t('userDeckDetail.confirmDeleteTopic') : t('userDeckDetail.confirmDeleteCard')}
        confirmText={confirmType === 'deleteTopic' ? t('userDeckDetail.deleteTopicTooltip') : t('userDeckDetail.deleteCardTooltip')}
        cancelText={t('decks.cancelBtn')}
        onConfirm={executeDelete}
        onCancel={() => setIsConfirmOpen(false)}
        isDanger={true}
      />
    </div>
  )
}

export default UserDeckDetailPage
