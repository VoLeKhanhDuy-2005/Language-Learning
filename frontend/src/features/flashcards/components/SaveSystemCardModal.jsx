import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getUserDecks, getUserDeckTopics, createUserCard } from "../flashcardsApi";
import "./SaveSystemCardModal.css";

function SaveSystemCardModal({ card, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [decks, setDecks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const [isLoadingDecks, setIsLoadingDecks] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch decks on mount
  useEffect(() => {
    const fetchDecks = async () => {
      setIsLoadingDecks(true);
      setErrorMsg("");
      try {
        const response = await getUserDecks({ limit: 100 });
        if (response.success && response.data) {
          const fetchedDecks = response.data.decks
          if (Array.isArray(fetchedDecks)) {
            setDecks(fetchedDecks);
          } else {
             setDecks([]);
          }
        }
      } catch (err) {
        console.error("Lỗi tải bộ từ:", err);
        setErrorMsg(t("decks.fetchError"));
      } finally {
        setIsLoadingDecks(false);
      }
    };
    fetchDecks();
  }, [t]);

  // Fetch topics when deck changes
  useEffect(() => {
    if (!selectedDeckId) {
      setTopics([]);
      setSelectedTopicId("");
      return;
    }
    const fetchTopics = async () => {
      setIsLoadingTopics(true);
      setErrorMsg("");
      try {
        const response = await getUserDeckTopics(selectedDeckId);
        if (response.success && response.data) {
          const fetchedTopics = response.data.topics || response.data;
          if (Array.isArray(fetchedTopics)) {
            const extractedTopics = fetchedTopics.map(item => item.topic || item);
            setTopics(extractedTopics);
            if (extractedTopics.length > 0) {
              setSelectedTopicId(extractedTopics[0]._id);
            }
          } else {
             setTopics([]);
          }
        }
      } catch (err) {
        console.error("Lỗi tải chủ đề:", err);
        setErrorMsg(t("decks.fetchError"));
      } finally {
        setIsLoadingTopics(false);
      }
    };
    fetchTopics();
  }, [selectedDeckId, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDeckId || !selectedTopicId) {
      setErrorMsg(t("flashcard.selectDeck") + " & " + t("flashcard.selectTopic"));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        topicId: selectedTopicId,
        term: card.term,
        translation: card.translation || "",
        pos: card.pos || "",
        phonetics: card.phonetics || [],
        explanation: card.explanation || {
          en: card.explanationEn || "",
          vi: card.explanationVi || "",
        },
        examples: card.examples || {
          en: card.exampleEn || "",
          vi: card.exampleVi || "",
        },
        imageUrl: card.imageUrl || "",
        relatedWords: card.relatedWords || [],
      };

      const response = await createUserCard(selectedDeckId, payload);
      if (response.success) {
        setSuccessMsg(t("flashcard.saveSuccess"));
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(response.message || t("decks.errorCommon"));
      }
    } catch (err) {
      console.error("Lỗi lưu từ vựng:", err);
      setErrorMsg(err.response?.data?.message || t("decks.errorSystem"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="save-card-modal-overlay" onClick={onClose}>
      <div className="save-card-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="save-card-modal-header">
          <h3>{t("flashcard.saveToMyDeckTitle")}</h3>
          <button className="save-card-modal-close" onClick={onClose} disabled={isSubmitting}>
            &times;
          </button>
        </div>

        <div className="save-card-modal-body">
          {errorMsg && <div className="save-card-alert error">{errorMsg}</div>}
          {successMsg && <div className="save-card-alert success">{successMsg}</div>}

          <form onSubmit={handleSubmit}>
            <div className="save-card-form-group">
              <label>{t("flashcard.selectDeck")}</label>
              <select
                className="save-card-select"
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                disabled={isLoadingDecks || isSubmitting}
              >
                <option value="" disabled>
                  -- {t("flashcard.selectDeck")} --
                </option>
                {decks.map((deck) => (
                  <option key={deck._id} value={deck._id}>
                    {deck.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="save-card-form-group">
              <label>{t("flashcard.selectTopic")}</label>
              <select
                className="save-card-select"
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                disabled={!selectedDeckId || isLoadingTopics || isSubmitting || topics.length === 0}
              >
                {topics.length === 0 && (
                  <option value="" disabled>
                    -- {t("flashcard.noTopic")} --
                  </option>
                )}
                {topics.length > 0 && (
                  <option value="" disabled>
                    -- {t("flashcard.selectTopic")} --
                  </option>
                )}
                {topics.map((topic) => (
                  <option key={topic._id} value={topic._id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="save-card-modal-footer">
              <button
                type="button"
                className="save-card-btn-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t("decks.cancelBtn")}
              </button>
              <button
                type="submit"
                className="save-card-btn-submit"
                disabled={!selectedDeckId || !selectedTopicId || isSubmitting || topics.length === 0}
              >
                {isSubmitting ? t("decks.processing") : t("flashcard.saveToMyDeck")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SaveSystemCardModal;
