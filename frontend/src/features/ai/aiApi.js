import apiClient from "../../services/apiClient";

/**
 * Gửi câu hỏi đến AI
 * @param {string} question - Câu hỏi
 * @param {'minlish'|'network'} mode - Chế độ trả lời
 * @param {'vi'|'en'} language - Ngôn ngữ
 * @param {string|null} conversationId - ID hội thoại (nếu có)
 */
export const askAIQuestion = async (
  question,
  mode = "minlish",
  language = "vi",
  conversationId = null,
) => {
  const response = await apiClient.post("/ai/response", {
    question,
    mode,
    language,
    ...(conversationId && { conversationId }),
  });
  return response.data;
};

// Conversation History APIs
/**
 * Lấy danh sách tất cả hội thoại của user hiện tại
 */
export const getConversations = async () => {
  const response = await apiClient.get("/ai/conversations");
  return response.data;
};

/**
 * Lấy chi tiết một hội thoại (kèm messages)
 */
export const getConversation = async (conversationId) => {
  const response = await apiClient.get(`/ai/conversations/${conversationId}`);
  return response.data;
};

/**
 * Tạo hội thoại mới
 */
export const createConversation = async () => {
  const response = await apiClient.post("/ai/conversations");
  return response.data;
};

/**
 * Xoá một hội thoại
 */
export const deleteConversation = async (conversationId) => {
  const response = await apiClient.delete(
    `/ai/conversations/${conversationId}`,
  );
  return response.data;
};

/**
 * Đổi tên hội thoại
 */
export const renameConversation = async (conversationId, title) => {
  const response = await apiClient.patch(
    `/ai/conversations/${conversationId}/title`,
    { title },
  );
  return response.data;
};
