import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { searchSystemVocabulary } from "../flashcardsApi";
import Pagination from "../../../components/Pagination/Pagination";

export default function UserCardSearchTab({ onNavigate }) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [cards, setCards] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCards = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const data = await searchSystemVocabulary({
        q: searchInput,
        page,
        limit: 20,
      });
      // The API returns { data: { cards, pagination }, ... }
      if (data && data.data) {
        setCards(data.data.cards || []);
        setPagination(
          data.data.pagination || { page: 1, totalPages: 1, totalItems: 0 },
        );
      } else {
        setCards([]);
      }
    } catch (err) {
      setError(t("decks.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCards(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, t]);

  const handleCardClick = (deckId, topicId, cardId) => {
    // Navigate to the topic's detail page
    if (deckId && onNavigate) {
      onNavigate(`/decks/${deckId}?topicId=${topicId}&cardId=${cardId}`);
    }
  };

  return (
    <div className="user-card-search-tab">
      <div className="admin-filter-bar" style={{ marginBottom: "20px", display: "flex" }}>
        <div
          className="admin-search-wrap"
          style={{ flex: 1, width: "100%", position: "relative" }}
        >
          <svg
            className="admin-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "var(--color-on-surface-variant)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder={t("admin.searchCardPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: "100%", padding: "12px 16px 12px 48px", borderRadius: "8px", border: "1px solid var(--color-outline-variant)", background: "transparent", color: "var(--color-on-surface)", outline: "none" }}
          />
        </div>
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      {loading && (
        <div className="admin-loading" style={{ margin: "40px 0", textAlign: "center" }}>
          <span>{t("admin.loading")}</span>
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div
          className="admin-table-wrapper"
          style={{
            overflowX: "auto",
            background: "var(--color-surface)",
            borderRadius: "16px",
            border: "1px solid var(--color-outline-variant)",
          }}
        >
          <table
            className="admin-table"
            style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
          >
            <thead
              style={{
                background: "color-mix(in srgb, var(--color-surface) 95%, black)",
              }}
            >
              <tr>
                <th
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--color-outline-variant)",
                    fontWeight: 600,
                  }}
                >
                  {t("common.cardTerm")}
                </th>
                <th
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--color-outline-variant)",
                    fontWeight: 600,
                  }}
                >
                  {t("common.cardTranslation")}
                </th>
                <th
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--color-outline-variant)",
                    fontWeight: 600,
                  }}
                >
                  {t("common.cardPos")}
                </th>
                <th
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--color-outline-variant)",
                    fontWeight: 600,
                  }}
                >
                  {t("common.deckName")}
                </th>
                <th
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--color-outline-variant)",
                    fontWeight: 600,
                  }}
                >
                  {t("common.topicName")}
                </th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr
                  key={card.sourceCardId}
                  onClick={() =>
                    handleCardClick(card.deckId, card.topicId, card.sourceCardId)
                  }
                  style={{ cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--color-surface-variant)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid var(--color-outline-variant)",
                    }}
                  >
                    <strong>{card.term}</strong>
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid var(--color-outline-variant)",
                    }}
                  >
                    {card.translation}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid var(--color-outline-variant)",
                    }}
                  >
                    {card.pos}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid var(--color-outline-variant)",
                    }}
                  >
                    {card.deckName || "-"}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid var(--color-outline-variant)",
                    }}
                  >
                    {card.topicName || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && cards.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--color-on-surface-variant)",
          }}
        >
          {t("admin.noCardsFound")}
        </div>
      )}

      {/* Pagination */}
      {!loading && cards.length > 0 && pagination.totalPages > 1 && (
        <div style={{ marginTop: "24px", display: "flex", justifyContent: "center" }}>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => fetchCards(page)}
          />
        </div>
      )}
    </div>
  );
}
