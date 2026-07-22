import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchFromDictionaryApi } from "../../utils/dictionaryApi";
import SaveSystemCardModal from "../../features/flashcards/components/SaveSystemCardModal";
import "./DictionaryLookupModal.css";

function DictionaryLookupModal({ word, onClose }) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardData, setCardData] = useState(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  useEffect(() => {
    if (!word) return;

    const fetchDict = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchFromDictionaryApi(word);
        if (res.success && res.data) {
          // fetchFromDictionaryApi returns { term, translation, pos, explanation, examples, phonetics }
          setCardData(res.data);
        } else {
          setError(res.message || t("api.common.UNKNOWN_ERROR"));
        }
      } catch (err) {
        console.error("Dictionary API Error:", err);
        setError(err.response?.data?.message || t("api.common.UNKNOWN_ERROR"));
      } finally {
        setLoading(false);
      }
    };

    fetchDict();
  }, [word, t]);

  const handleAudioPlay = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => console.error("Lỗi phát âm thanh:", err));
    }
  };

  const handleSaveToDeck = () => {
    setIsSaveModalOpen(true);
  };

  return (
    <>
      <div className="dictionary-lookup-overlay" onClick={onClose}>
        <div className="dictionary-lookup-container" onClick={(e) => e.stopPropagation()}>
          <div className="dictionary-lookup-header">
            <h3>Tra từ vựng</h3>
            <button className="dictionary-lookup-close" onClick={onClose}>
              &times;
            </button>
          </div>

          <div className="dictionary-lookup-body">
            {loading ? (
              <div className="dictionary-loading">
                <div className="dictionary-spinner"></div>
                <p>Đang tra từ "{word}"...</p>
              </div>
            ) : error ? (
              <div className="dictionary-error">
                <p>{error}</p>
                <button onClick={onClose} className="btn-close-error">Đóng</button>
              </div>
            ) : cardData ? (
              <div className="dictionary-card-preview">
                <div className="dict-column-left">
                  <div className="dict-term-row">
                    <h2 className="dict-term">{cardData.term}</h2>
                    
                    {/* Các nút phát âm giọng US/UK */}
                    <div className="dict-audio-group">
                      {cardData.phonetics?.map((phonetic, index) => {
                        const isUS = phonetic.locale?.toLowerCase().includes("us");
                        const isUK =
                          phonetic.locale?.toLowerCase().includes("uk") ||
                          phonetic.locale?.toLowerCase().includes("gb");
                        const label = isUS ? "US" : isUK ? "UK" : "";
                        return phonetic.audio ? (
                          <button
                            key={index}
                            className="dict-speaker-btn"
                            onClick={() => handleAudioPlay(phonetic.audio)}
                            title={label ? `Phát âm ${label}` : "Phát âm"}
                          >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                            {label && <span className="dict-audio-label">{label}</span>}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <p className="dict-meta">
                    {cardData.pos && <span className="dict-pos">({cardData.pos})</span>}
                    {cardData.phonetics?.map((phonetic, index) => {
                      const isUS = phonetic.locale?.toLowerCase().includes("us");
                      const isUK =
                        phonetic.locale?.toLowerCase().includes("uk") ||
                        phonetic.locale?.toLowerCase().includes("gb");
                      const label = isUS ? "US" : isUK ? "UK" : "";
                      return phonetic.text ? (
                        <span key={index} className="dict-phonetic-wrapper">
                          {label && <span className="dict-phonetic-locale">{label}</span>}
                          <span className="dict-phonetic-text">/{phonetic.text}/</span>
                        </span>
                      ) : null;
                    })}
                  </p>

                  <div className="dict-translation">
                    {cardData.translation}
                  </div>

                  {cardData.imageUrl && (
                    <div className="dict-image-container">
                      <img src={cardData.imageUrl} alt={cardData.term} className="dict-image" />
                    </div>
                  )}
                </div>

                <div className="dict-column-right">
                  {cardData.explanationEn && (
                    <div className="dict-explanation">
                      <strong>Định nghĩa (EN):</strong>
                      <p>{cardData.explanationEn}</p>
                    </div>
                  )}
                  {cardData.explanationVi && (
                    <div className="dict-explanation">
                      <strong>Giải thích (VI):</strong>
                      <p>{cardData.explanationVi}</p>
                    </div>
                  )}

                  {cardData.exampleEn && (
                    <div className="dict-example">
                      <strong>Ví dụ (EN):</strong>
                      <p>{cardData.exampleEn}</p>
                    </div>
                  )}
                  {cardData.exampleVi && (
                    <div className="dict-example">
                      <strong>Ví dụ (VI):</strong>
                      <p>{cardData.exampleVi}</p>
                    </div>
                  )}

                  {cardData.relatedWords && cardData.relatedWords.length > 0 && (
                    <div className="dict-related-words">
                      <strong>Từ liên quan:</strong>
                      <div className="dict-related-tags">
                        {cardData.relatedWords.map((relatedWord, idx) => (
                          <span key={idx} className="dict-related-tag">
                            {relatedWord}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          
          {cardData && !loading && !error && (
            <div className="dictionary-lookup-footer">
               <button className="dict-btn-save" onClick={handleSaveToDeck}>
                  {t("flashcard.saveToMyDeck")}
               </button>
            </div>
          )}
        </div>
      </div>

      {isSaveModalOpen && cardData && (
        <SaveSystemCardModal
          card={cardData}
          onClose={() => setIsSaveModalOpen(false)}
          onSuccess={() => {
             // Handle success (maybe close dictionary lookup as well, or just show success)
          }}
        />
      )}
    </>
  );
}

export default DictionaryLookupModal;
