import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  getDeckDetail,
  getUserDeckDetail,
  getDeckTopics,
  getUserDeckTopics,
  getTopicCards,
  getUserTopicStudyCards,
} from "../flashcardsApi";
import FlashCard from "../components/FlashCard";
import FlashCardQuiz from "../components/FlashCardQuiz";
import "./DeckDetailPage.css";

function DeckDetailPage({ deckId, isSystem = true, onNavigate }) {
  const { t } = useTranslation();
  const [deck, setDeck] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studyMode, setStudyMode] = useState("flashcard"); // 'flashcard' hoặc 'quiz'
  const [isViewMode, setIsViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "view";
  });

  const [loadingDeck, setLoadingDeck] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState("");

  // 1. Tải thông tin chi tiết deck và danh sách topics
  useEffect(() => {
    const fetchDeckData = async () => {
      setLoadingDeck(true);
      setError("");
      try {
        let deckDetailPromise;
        let deckTopicsPromise;

        if (isSystem) {
          deckDetailPromise = getDeckDetail(deckId);
          deckTopicsPromise = getDeckTopics(deckId);
        } else {
          deckDetailPromise = getUserDeckDetail(deckId);
          deckTopicsPromise = getUserDeckTopics(deckId);
        }

        const [deckDetailRes, deckTopicsRes] = await Promise.all([
          deckDetailPromise,
          deckTopicsPromise,
        ]);

        if (deckDetailRes.success) {
          setDeck(deckDetailRes.data);
        }

        if (deckTopicsRes.success && Array.isArray(deckTopicsRes.data.topics)) {
          const fetchedTopics = deckTopicsRes.data.topics;
          setTopics(fetchedTopics);

          const queryParams = new URLSearchParams(window.location.search);
          const urlTopicId = queryParams.get("topicId");

          if (fetchedTopics.length > 0) {
            let defaultTopic = fetchedTopics[0];
            if (urlTopicId) {
              const matchedTopic = fetchedTopics.find(
                (t) => t.topic._id === urlTopicId,
              );
              if (matchedTopic) defaultTopic = matchedTopic;
            }
            setSelectedTopic(defaultTopic);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu chi tiết bộ từ:", err);
        setError(t("deckDetail.noData"));
      } finally {
        setLoadingDeck(false);
      }
    };

    if (deckId) {
      fetchDeckData();
    }
  }, [deckId, isSystem, t]);

  const selectedTopicId = selectedTopic?.topic?._id;

  // 2. Tải danh sách cards khi topic thay đổi
  useEffect(() => {
    const fetchTopicCards = async () => {
      if (!selectedTopicId) return;
      setLoadingCards(true);
      try {
        const response = isSystem
          ? await getTopicCards(deckId, selectedTopicId)
          : await getUserTopicStudyCards(deckId, selectedTopicId);
        if (response.success && Array.isArray(response.data.cards)) {
          const allCards = response.data.cards;
          let filteredWords = allCards.filter((item) => !item.userCardState);

          const queryParams = new URLSearchParams(window.location.search);
          const urlCardId = queryParams.get("cardId");
          const urlMode = queryParams.get("mode");
          let startIndex = 0;

          if (urlMode === "view") {
            setIsViewMode(true);
          } else {
            setIsViewMode(false);
          }

          if (urlCardId) {
            const targetCard = allCards.find(
              (item) => item.card._id === urlCardId,
            );
            if (targetCard) {
              if (!filteredWords.some((item) => item.card._id === urlCardId)) {
                filteredWords.unshift(targetCard);
              }
              startIndex = filteredWords.findIndex(
                (item) => item.card._id === urlCardId,
              );
            }
          }

          setCards(filteredWords);
          setCurrentCardIndex(Math.max(0, startIndex));
        }
      } catch (err) {
        console.error("Lỗi tải thẻ của topic:", err);
      } finally {
        setLoadingCards(false);
      }
    };

    fetchTopicCards();
  }, [selectedTopicId, deckId]);

  // Xử lý học xong 1 thẻ từ (grade hoặc ẩn thành công)
  const handleCardSuccess = (gradeOrAction) => {
    // Chuyển sang thẻ tiếp theo
    setCurrentCardIndex((prev) => prev + 1);

    // Tự động cập nhật tiến độ học của chủ đề
    if (selectedTopic) {
      const topicId = selectedTopic.topic._id;
      setTopics((prevTopics) =>
        prevTopics.map((item) => {
          if (item.topic._id === topicId) {
            const currentProgress = item.userProgress || {
              learnedCardCount: 0,
              totalCardCount: 0,
              progressPct: 0,
            };
            const newLearned = Math.min(
              currentProgress.learnedCardCount + 1,
              currentProgress.totalCardCount,
            );
            const newPct =
              currentProgress.totalCardCount > 0
                ? Math.round(
                    (newLearned / currentProgress.totalCardCount) * 100,
                  )
                : 0;

            const updatedItem = {
              ...item,
              userProgress: {
                ...currentProgress,
                learnedCardCount: newLearned,
                progressPct: newPct,
              },
            };

            // Đồng bộ lại selectedTopic
            setSelectedTopic(updatedItem);
            return updatedItem;
          }
          return item;
        }),
      );
    }
  };

  // Cập nhật userCardState cho thẻ khi có thay đổi (ví dụ: đánh dấu sao)
  const handleCardStateChange = (cardId, updatedState) => {
    setCards((prevCards) =>
      prevCards.map((item) => {
        if (item.card._id === cardId) {
          return {
            ...item,
            userCardState: updatedState,
          };
        }
        return item;
      }),
    );
  };

  const handleBackClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      if (isViewMode) {
        onNavigate(-1);
      } else {
        onNavigate("/decks", { tab: isSystem ? "system" : "user" });
      }
    }
  };

  if (loadingDeck) {
    return (
      <div className="deck-detail-loading-screen">
        <div className="deck-detail-spinner"></div>
        <p>{t("deckDetail.loading")}</p>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="deck-detail-error-screen">
        <p className="error-text">{error || t("deckDetail.noData")}</p>
        <button onClick={handleBackClick} className="btn-back">
          {t("deckDetail.backBtn")}
        </button>
      </div>
    );
  }

  // Lấy tiến độ của topic đang hoạt động
  const activeProgress = selectedTopic?.userProgress || {
    learnedCardCount: 0,
    totalCardCount: 0,
    progressPct: 0,
  };

  return (
    <div className="deck-detail-container">
      {/* Header góc trên */}
      <div className="deck-detail-header-row">
        <div className="deck-detail-title-wrapper">
          <button
            onClick={handleBackClick}
            className="back-arrow-btn"
            aria-label="Go back"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="deck-detail-name">{deck.title}</h1>
        </div>
      </div>

      {/* Grid chính chia 2 cột */}
      <div className={`deck-detail-layout ${isViewMode ? "view-mode" : ""}`}>
        {/* CỘT BÊN TRÁI: DANH SÁCH TOPIC */}
        {!isViewMode && (
          <aside className="deck-detail-sidebar">
            <div className="sidebar-topics-list">
              {topics.map((item) => {
                const isSelected = selectedTopic?.topic._id === item.topic._id;
                const progress = item.userProgress || {
                  learnedCardCount: 0,
                  totalCardCount: 0,
                  progressPct: 0,
                };
                return (
                  <button
                    key={item.topic._id}
                    className={`topic-item-card ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedTopic(item)}
                  >
                    <div className="topic-card-info">
                      <span className="topic-name">{item.topic.name}</span>
                      <span className="topic-progress-text">
                        {progress.learnedCardCount} / {progress.totalCardCount}{" "}
                        {t("deckDetail.wordsCount")}
                      </span>
                    </div>
                    {/* Thanh tiến độ mini của từng topic */}
                    <div className="topic-mini-progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress.progressPct}%` }}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* CỘT BÊN PHẢI: PHẦN HỌC CHI TIẾT */}
        <main className="deck-detail-content-area">
          {selectedTopic ? (
            <div className="study-section-wrapper">
              {/* Thanh tiến độ chính lớn phía trên */}
              {!isViewMode && (
                <div className="main-progress-section">
                  <div className="main-progress-info">
                    <span className="main-progress-percent">
                      {activeProgress.progressPct}% {t("deckDetail.completed")}
                    </span>
                  </div>
                  <div className="main-progress-bar">
                    <div
                      className="main-progress-fill"
                      style={{ width: `${activeProgress.progressPct}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Chuyển đổi 2 chế độ học */}
              {!isViewMode && (
                <div className="study-mode-switch-wrapper">
                  <span className="study-mode-label">
                    {t("deckDetail.studyMode")}
                  </span>
                  <div className="mode-toggle-buttons">
                    <button
                      className={`mode-btn ${studyMode === "flashcard" ? "active" : ""}`}
                      onClick={() => setStudyMode("flashcard")}
                    >
                      FlashCard
                    </button>
                    <button
                      className={`mode-btn ${studyMode === "quiz" ? "active" : ""}`}
                      onClick={() => setStudyMode("quiz")}
                    >
                      Quiz
                    </button>
                  </div>
                </div>
              )}

              {/* Phần học thẻ */}
              <div className="study-card-render-zone">
                {loadingCards ? (
                  <div className="study-loading-zone">
                    <div className="study-spinner"></div>
                  </div>
                ) : currentCardIndex < cards.length ? (
                  <>
                    {/* Khung flashcard hoặc quiz */}
                    {studyMode === "flashcard" ? (
                      <FlashCard
                        key={cards[currentCardIndex].card._id}
                        cardItem={cards[currentCardIndex]}
                        mode={isViewMode ? "view" : "learn"}
                        onSuccess={handleCardSuccess}
                        onCardStateChange={handleCardStateChange}
                      />
                    ) : (
                      <FlashCardQuiz
                        key={cards[currentCardIndex].card._id}
                        cardItem={cards[currentCardIndex]}
                        mode={isViewMode ? "view" : "learn"}
                        onSuccess={handleCardSuccess}
                        onCardStateChange={handleCardStateChange}
                      />
                    )}
                  </>
                ) : (
                  // MÀN HÌNH HOÀN THÀNH HỌC TỪ MỚI
                  <div className="study-completion-screen">
                    <div className="completion-icon-wrapper">
                      <svg
                        viewBox="0 0 24 24"
                        width="48"
                        height="48"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <h3 className="completion-title">
                      {t("deckDetail.allNewLearned")}
                    </h3>
                    <p className="completion-subtitle">
                      {t("deckDetail.noNewWords")}
                      <br />
                      {t("deckDetail.selectAnotherTopic")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-topic-selected">
              <p>{t("deckDetail.noData")}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DeckDetailPage;
