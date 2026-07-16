import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { searchSystemVocabulary } from "../../../flashcards/flashcardsApi";
import Pagination from "../../../../components/Pagination/Pagination";

export default function AdminCardSearchTab({ onNavigate }) {
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
      setError(t("admin.fetchError"));
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
    if (deckId && topicId && cardId && onNavigate) {
      onNavigate(`/admin/decks/${deckId}/topics/${topicId}/cards/${cardId}/edit?from=search`);
    }
  };

  return (
    <div className="admin-card-search-tab">
      <div className="admin-filter-bar" style={{ marginBottom: "20px" }}>
        <div
          className="admin-search-wrap"
          style={{ flex: 1, maxWidth: "500px" }}
        >
          <svg
            className="admin-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
          />
        </div>
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      {loading && (
        <div className="admin-loading" style={{ margin: "40px 0" }}>
          <div className="admin-loading-spinner" />
          <span>{t("admin.loading")}</span>
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div
          className="admin-table-wrapper"
          style={{
            overflowX: "auto",
            background: "var(--color-surface)",
            borderRadius: "12px",
            border: "1px solid var(--color-outline-variant)",
          }}
        >
          <table
            className="admin-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead
              style={{
                background:
                  "color-mix(in srgb, var(--color-surface) 95%, black)",
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
              {cards.map((c) => (
                <tr
                  key={c.sourceCardId}
                  style={{
                    borderBottom: "1px solid var(--color-outline-variant)",
                    cursor: c.deckId && c.topicId ? "pointer" : "default",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "color-mix(in srgb, var(--color-surface) 98%, black)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "var(--color-surface)")
                  }
                  onClick={() =>
                    handleCardClick(c.deckId, c.topicId, c.sourceCardId)
                  }
                >
                  <td
                    style={{
                      padding: "16px",
                      fontWeight: 500,
                      color: "var(--color-primary)",
                    }}
                  >
                    {c.term}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      color: "var(--color-on-surface-variant)",
                    }}
                  >
                    {c.translation}
                  </td>
                  <td style={{ padding: "16px" }}>
                    {c.pos ? (
                      <span
                        style={{
                          padding: "4px 8px",
                          background: "var(--color-secondary-container)",
                          color: "var(--color-on-secondary-container)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          textTransform: "uppercase",
                        }}
                      >
                        {c.pos}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      color: "var(--color-on-surface-variant)",
                    }}
                  >
                    {c.deckName || "-"}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      color: "var(--color-on-surface-variant)",
                    }}
                  >
                    {c.topicName || "-"}
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
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => fetchCards(page)}
        />
      )}
    </div>
  );
}
