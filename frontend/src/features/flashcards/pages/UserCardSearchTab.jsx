import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { searchSystemVocabulary, fetchUserCardStates } from "../flashcardsApi";
import Pagination from "../../../components/Pagination/Pagination";

export default function UserCardSearchTab({ onNavigate }) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const [subTab, setSubTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("sub") || "all";
  });
  const [cards, setCards] = useState([]);
  const [pagination, setPagination] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get("page")) || 1;
    return {
      page: page,
      totalPages: 1,
      totalItems: 0,
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCards = async (page = 1) => {
    // Update URL to preserve state
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set("tab", "cards");
    if (searchInput) {
      currentUrl.searchParams.set("q", searchInput);
    } else {
      currentUrl.searchParams.delete("q");
    }
    if (page > 1) {
      currentUrl.searchParams.set("page", page.toString());
    } else {
      currentUrl.searchParams.delete("page");
    }
    if (subTab !== "all") {
      currentUrl.searchParams.set("sub", subTab);
    } else {
      currentUrl.searchParams.delete("sub");
    }
    window.history.replaceState(
      window.history.state,
      "",
      currentUrl.toString(),
    ); //"": title

    setLoading(true);
    setError("");
    try {
      let data;
      if (subTab === "all") {
        data = await searchSystemVocabulary({
          q: searchInput,
          page,
          limit: 20,
        });
      } else {
        data = await fetchUserCardStates({
          starred: subTab === "starred" ? true : undefined,
          hidden: subTab === "hidden" ? true : undefined,
          page,
          limit: 20,
        });
      }
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

  const isFirstRender = React.useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isFirstRender.current) {
        fetchCards(pagination.page);
        isFirstRender.current = false;
      } else {
        fetchCards(1);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, subTab, t]);
  // Ví dụ bạn có URL /cards?page=5
  // - Lần đầu mở trang: Muốn giữ nguyên trang 5
  // - Nhưng khi người dùng thay đổi bộ lọc: Search: "apple" -> thì thường sẽ muốn quay về trang đầu: fetchCards(1);

  const handleCardClick = (deckId, topicId, cardId) => {
    // Navigate to the topic's detail page in view mode
    if (deckId && onNavigate) {
      onNavigate(
        `/decks/${deckId}?topicId=${topicId}&cardId=${cardId}&mode=view`,
      );
    }
  };

  return (
    <div className="user-card-search-tab">
      <div className="deck-search-section" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button
            className={`deck-tab-btn ${subTab === "all" ? "active" : ""}`}
            onClick={() => {
              setSubTab("all");
              setSearchInput("");
              setPagination({ ...pagination, page: 1 });
            }}
          >
            {t("common.all")}
          </button>
          <button
            className={`deck-tab-btn ${subTab === "starred" ? "active" : ""}`}
            onClick={() => {
              setSubTab("starred");
              setSearchInput("");
              setPagination({ ...pagination, page: 1 });
            }}
          >
            {t("common.starred")}
          </button>
          <button
            className={`deck-tab-btn ${subTab === "hidden" ? "active" : ""}`}
            onClick={() => {
              setSubTab("hidden");
              setSearchInput("");
              setPagination({ ...pagination, page: 1 });
            }}
          >
            {t("common.hidden")}
          </button>
        </div>

        {subTab === "all" && (
          <div className="deck-search-bar-wrapper">
            <svg
              className="deck-search-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
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
              className="deck-search-input"
              placeholder={t("admin.searchCardPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        )}
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      {loading && (
        <div
          className="admin-loading"
          style={{ margin: "40px 0", textAlign: "center" }}
        >
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
              {cards.map((card) => (
                <tr
                  key={card.sourceCardId}
                  onClick={() =>
                    handleCardClick(
                      card.deckId,
                      card.topicId,
                      card.sourceCardId,
                    )
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
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            justifyContent: "center",
          }}
        >
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
