import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import {
  askAIQuestion,
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
} from "../aiApi";
import "./AIChatPage.css";

// ── Icons (inline SVG để không phụ thuộc thư viện icon) ──────────────────────
const IconSparkles = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);
const IconGlobe = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconSend = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);
const IconPlus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);
const IconChat = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);
const IconChevronRight = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const IconTrash = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);
const IconMenu = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconX = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconClock = ({ size = 9 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ── Sample prompts ─────────────────────────────────────────────────────────────
const MINLISH_SAMPLES = [
  "Từ 'eloquent' nghĩa là gì?",
  "Giải thích sự khác nhau giữa 'make' và 'do' trong tiếng Anh",
];
const NETWORK_SAMPLES = [
  "Cách phân biệt Present Perfect và Simple Past",
  "Các idiom phổ biến trong tiếng Anh thương mại",
];

// ── TypingIndicator ──────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="ai-typing-indicator">
    <span className="ai-typing-dot" />
    <span className="ai-typing-dot" />
    <span className="ai-typing-dot" />
  </div>
);

// ── SearchingIndicator ──────────────────────────────────────────────────────
const SearchingIndicator = ({ query }) => (
  <div className="ai-searching">
    <IconGlobe size={12} className="ai-spin" />
    <span>Đang tìm kiếm: &quot;{query}&quot;</span>
  </div>
);

// ── MessageBubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const timeStr = new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (msg.role === "user") {
    return (
      <div className="ai-msg-user">
        <div className="ai-msg-user-inner">
          <div className="ai-bubble-user">{msg.content}</div>
          <div className="ai-msg-meta right">{timeStr}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-msg-assistant">
      <div className={`ai-assistant-icon ${msg.mode}`}>
        {msg.mode === "minlish" ? (
          <IconSparkles size={14} />
        ) : (
          <IconGlobe size={14} />
        )}
      </div>
      <div className="ai-assistant-body">
        {msg.isSearching && (
          <SearchingIndicator query={msg.searchQuery || ""} />
        )}
        {msg.isError ? (
          <div className="ai-error-bubble">{msg.content}</div>
        ) : (
          <div className="ai-assistant-text">{msg.content}</div>
        )}
        <div className="ai-msg-meta">
          {timeStr} · {msg.mode === "minlish" ? "MinLish AI" : "Web Search"}
        </div>
      </div>
    </div>
  );
};

// ── ConversationItem ─────────────────────────────────────────────────────────
const ConversationItem = ({ conversation, active, onClick, onDelete }) => (
  <button
    className={`ai-convo-item ${active ? "active" : ""}`}
    onClick={onClick}
    title={conversation.title}
  >
    <IconChat />
    <span className="ai-convo-item-label">{conversation.title}</span>
    {active && <IconChevronRight />}
    <button
      className="ai-convo-delete-btn"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(conversation._id);
      }}
      title="Xoá hội thoại"
    >
      <IconTrash size={12} />
    </button>
  </button>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIChatPage() {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const [mode, setMode] = useState("minlish"); // "minlish" | "network"
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Conversation history
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [loadingConvos, setLoadingConvos] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const language = i18n.language === "en" ? "en" : "vi";

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 130) + "px";
  }, [input]);

  // ── Load conversations list ────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setLoadingConvos(true);
    try {
      const res = await getConversations();
      setConversations(res.data || []);
    } catch {
      // silently fail
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Start new conversation ─────────────────────────────────────────────────
  const handleNewConversation = async () => {
    try {
      const res = await createConversation();
      const newConvo = res.data;
      setConversations((prev) => [newConvo, ...prev]);
      setActiveConversationId(newConvo._id);
      setMessages([]);
    } catch {
      // fallback: local session
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  // Load existing conversation
  const handleSelectConversation = async (convo) => {
    setActiveConversationId(convo._id);
    try {
      const res = await getConversation(convo._id);
      const fullConvo = res.data;
      const mapped = fullConvo.messages.map((m, i) => ({
        id: `${convo._id}_${i}`,
        role: m.role,
        content: m.content,
        mode: m.mode,
        timestamp: new Date(m.createdAt || Date.now()),
        isError: false,
      }));
      setMessages(mapped);
      setMode(fullConvo.lastMode || "minlish");
    } catch {
      setMessages([]);
    }
  };

  // ── Delete conversation ────────────────────────────────────────────────────
  const handleDeleteConversation = async (convoId) => {
    try {
      await deleteConversation(convoId);
      setConversations((prev) => prev.filter((c) => c._id !== convoId));
      if (activeConversationId === convoId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch {
      /* ignore */
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const text = input.trim();
    setInput("");

    // Ensure we have an active conversation
    let convoId = activeConversationId;
    if (!convoId) {
      try {
        const res = await createConversation();
        if (res && res.data && res.data._id) {
          convoId = res.data._id;
          setActiveConversationId(convoId);
          setConversations((prev) => [res.data, ...prev]);
        } else {
          throw new Error("Không nhận được ID hội thoại từ server.");
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content:
              "Lỗi hệ thống: Không thể tạo cuộc hội thoại mới để lưu lịch sử. " +
              (err.message || ""),
            mode,
            timestamp: new Date(),
            isError: true,
          },
        ]);
        return;
      }
    }

    const userMsg = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      mode,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await askAIQuestion(text, mode, language, convoId);
      const answer = res.data?.answer || "Không có câu trả lời.";

      const assistantMsg = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: answer,
        mode,
        timestamp: new Date(),
        isError: false,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Update sidebar title (first message auto-titles on backend)
      if (convoId) {
        setConversations((prev) =>
          prev.map((c) =>
            c._id === convoId
              ? {
                  ...c,
                  title:
                    c.title === "Cuộc hội thoại mới"
                      ? text.slice(0, 80)
                      : c.title,
                  updatedAt: new Date(),
                }
              : c,
          ),
        );
      }
    } catch (err) {
      const code = err?.response?.data?.code || "";
      let errMsg;
      if (code === "NO_DATA_MATCH") {
        errMsg =
          'MinLish chưa có dữ liệu phù hợp với câu hỏi này. Thử chuyển sang chế độ "Tìm kiếm mạng" nhé!';
      } else if (code === "INVALID_QUESTION") {
        errMsg =
          "Câu hỏi không liên quan đến học tiếng Anh. Vui lòng hỏi về từ vựng, ngữ pháp, phát âm hoặc dịch thuật.";
      } else if (code === "BUSY_TRY_AGAIN") {
        errMsg = "AI đang bận, vui lòng thử lại sau ít giây.";
      } else {
        errMsg =
          err?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      }
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: errMsg,
        mode,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name) =>
    name ? name.trim().charAt(0).toUpperCase() : "U";

  const samples = mode === "minlish" ? MINLISH_SAMPLES : NETWORK_SAMPLES;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ai-chat-root">
      {/* ── Sidebar ── */}
      <aside className={`ai-chat-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        {/* Header */}
        <div className="ai-sidebar-header">
          <div className="ai-sidebar-logo">
            <div className="ai-sidebar-logo-icon">
              <IconSparkles />
            </div>
            <span className="ai-sidebar-logo-text">MinLish AI</span>
          </div>
          <button
            className="ai-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <IconX />
          </button>
        </div>

        {/* New chat button */}
        <button className="ai-sidebar-new-btn" onClick={handleNewConversation}>
          <IconPlus />
          Cuộc hội thoại mới
        </button>

        {/* Conversation list */}
        <div className="ai-sidebar-section-label">Gần đây</div>
        <div className="ai-sidebar-list">
          {loadingConvos ? (
            <div className="ai-sidebar-section-label">Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div
              className="ai-sidebar-section-label"
              style={{ padding: "8px 16px" }}
            >
              Chưa có hội thoại nào
            </div>
          ) : (
            conversations.map((c) => (
              <ConversationItem
                key={c._id}
                conversation={c}
                active={activeConversationId === c._id}
                onClick={() => handleSelectConversation(c)}
                onDelete={handleDeleteConversation}
              />
            ))
          )}
        </div>

        {/* User footer */}
        <div className="ai-sidebar-footer">
          <div className="ai-user-pill">
            <div className="ai-user-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div>
              <div className="ai-user-name">{user?.name || "Người dùng"}</div>
              <div className="ai-user-plan">MinLish AI</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ai-chat-main">
        {/* Header */}
        <header className="ai-chat-header">
          {!sidebarOpen && (
            <button
              className="ai-sidebar-toggle-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <IconMenu />
            </button>
          )}

          {/* Mode toggle */}
          <div className="ai-mode-toggle">
            <button
              className={`ai-mode-btn ${mode === "minlish" ? "active-minlish" : ""}`}
              onClick={() => setMode("minlish")}
            >
              <IconSparkles size={13} />
              MinLish
            </button>
            <button
              className={`ai-mode-btn ${mode === "network" ? "active-network" : ""}`}
              onClick={() => setMode("network")}
            >
              <IconGlobe size={13} />
              Tìm kiếm mạng
            </button>
          </div>

          <div className="ai-header-spacer" />

          <div className={`ai-status-pill ${mode}`}>
            {mode === "minlish" ? (
              <>
                <IconSparkles size={11} /> Trả lời từ AI
              </>
            ) : (
              <>
                <IconGlobe size={11} /> Tìm kiếm thời gian thực
              </>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="ai-messages-area">
          {messages.length === 0 ? (
            <div className="ai-empty-state">
              <div className={`ai-empty-icon ${mode}`}>
                {mode === "minlish" ? (
                  <IconSparkles size={28} />
                ) : (
                  <IconGlobe size={28} />
                )}
              </div>
              <h2 className="ai-empty-title">
                {mode === "minlish"
                  ? "Xin chào! Tôi là MinLish AI"
                  : "Tìm kiếm mạng thông minh"}
              </h2>
              <p className="ai-empty-desc">
                {mode === "minlish"
                  ? "Trợ lý AI chuyên về học tiếng Anh. Hỏi bất cứ điều gì về từ vựng, phát âm hay dịch thuật."
                  : "Kết hợp AI với kiến thức tiếng Anh. Nhận câu trả lời chính xác về ngữ pháp và từ vựng."}
              </p>
              <div className="ai-suggestions">
                {samples.map((s, i) => (
                  <button
                    key={i}
                    className="ai-suggestion-btn"
                    onClick={() => setInput(s)}
                  >
                    <span className="ai-suggestion-label">Thử hỏi</span>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-messages-list">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {isTyping && (
                <div className="ai-msg-assistant">
                  <div className={`ai-assistant-icon ${mode}`}>
                    {mode === "minlish" ? (
                      <IconSparkles size={14} />
                    ) : (
                      <IconGlobe size={14} />
                    )}
                  </div>
                  <div className="ai-assistant-body">
                    {mode === "network" ? (
                      <SearchingIndicator
                        query={messages.at(-1)?.content || ""}
                      />
                    ) : (
                      <TypingIndicator />
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="ai-input-bar">
          <div className="ai-input-wrap">
            <div className={`ai-input-box ${mode}`}>
              <span className={`ai-input-icon ${mode}`}>
                {mode === "minlish" ? (
                  <IconSparkles size={16} />
                ) : (
                  <IconGlobe size={16} />
                )}
              </span>
              <textarea
                ref={textareaRef}
                className="ai-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === "minlish"
                    ? "Hỏi MinLish AI về tiếng Anh..."
                    : "Tìm kiếm thông tin về tiếng Anh..."
                }
                rows={1}
                disabled={isTyping}
              />
              <button
                className={`ai-send-btn ${input.trim() && !isTyping ? `active-${mode}` : "disabled"}`}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <IconSend />
              </button>
            </div>
            <div className="ai-input-hint">
              <span>Enter gửi · Shift+Enter xuống dòng</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <IconClock />
                {new Date().toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
