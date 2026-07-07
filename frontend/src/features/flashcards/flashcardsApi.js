import apiClient from '../../services/apiClient'

/**
 * Lấy danh sách bộ từ hệ thống (ownerType = system) đã công khai
 * @param {Object} params các tham số lọc: tagId, cefrLevelId, q, page, limit
 */
export const getSystemDecks = async (params = {}) => {
  const response = await apiClient.get('/decks', { params })
  return response.data
}

/**
 * Lấy danh sách bộ từ cá nhân của người dùng hiện tại (ownerType = user)
 * @param {Object} params các tham số lọc: q, page, limit
 */
export const getUserDecks = async (params = {}) => {
  const response = await apiClient.get('/users/me/decks', { params })
  return response.data
}

/**
 * Tạo deck mới do người dùng sở hữu (ownerType = user)
 * @param {Object} data payload gồm title và description
 */
export const createUserDeck = async (data) => {
  const response = await apiClient.post('/users/me/decks', data)
  return response.data
}

/**
 * Cập nhật thông tin deck do người dùng sở hữu
 * @param {string} deckId ID của deck
 * @param {Object} data payload gồm title hoặc description
 */
export const updateUserDeck = async (deckId, data) => {
  const response = await apiClient.put(`/users/me/decks/${deckId}`, data)
  return response.data
}

/**
 * Xóa deck cá nhân của người dùng
 * @param {string} deckId ID của deck
 */
export const deleteUserDeck = async (deckId) => {
  const response = await apiClient.delete(`/users/me/decks/${deckId}`)
  return response.data
}

/**
 * Lấy danh sách tất cả các cấp độ CEFR
 */
export const getCefrLevels = async () => {
  const response = await apiClient.get('/cefr-levels')
  return response.data
}

/**
 * Lấy danh sách các tag dùng trong deck để lọc
 */
export const getTags = async () => {
  const response = await apiClient.get('/tags', { params: { usedBy: 'deck' } })
  return response.data
}

/**
 * Cập nhật một phần trạng thái học của thẻ từ (patch card state)
 * @param {string} cardId ID của thẻ từ
 * @param {Object} data payload gồm srs hoặc flags
 */
export const patchCardState = async (cardId, data) => {
  const response = await apiClient.patch(`/users/me/card-states/${cardId}`, data)
  return response.data
}

/**
 * Lấy chi tiết deck hệ thống
 * @param {string} deckId ID của deck
 */
export const getDeckDetail = async (deckId) => {
  const response = await apiClient.get(`/decks/${deckId}`)
  return response.data
}

/**
 * Lấy chi tiết deck cá nhân
 * @param {string} deckId ID của deck
 */
export const getUserDeckDetail = async (deckId) => {
  const response = await apiClient.get(`/users/me/decks/${deckId}`)
  return response.data
}

/**
 * Lấy danh sách topic của deck hệ thống kèm tiến độ
 * @param {string} deckId ID của deck
 */
export const getDeckTopics = async (deckId) => {
  const response = await apiClient.get(`/decks/${deckId}/topics`)
  return response.data
}

/**
 * Lấy danh sách topic của deck cá nhân kèm tiến độ
 * @param {string} deckId ID của deck
 */
export const getUserDeckTopics = async (deckId) => {
  const response = await apiClient.get(`/users/me/decks/${deckId}/topics`)
  return response.data
}

/**
 * Lấy danh sách card thuộc topic trong deck
 * @param {string} deckId ID của deck
 * @param {string} topicId ID của topic
 */
export const getTopicCards = async (deckId, topicId) => {
  const response = await apiClient.get(`/decks/${deckId}/topics/${topicId}/cards`)
  return response.data
}

/**
 * Tạo topic mới cá nhân
 * @param {string} deckId ID của deck
 * @param {Object} data payload gồm name
 */
export const createUserTopic = async (deckId, data) => {
  const response = await apiClient.post(`/users/me/decks/${deckId}/topics`, data)
  return response.data
}

/**
 * Cập nhật topic cá nhân
 * @param {string} deckId ID của deck
 * @param {string} topicId ID của topic
 * @param {Object} data payload gồm name
 */
export const updateUserTopic = async (deckId, topicId, data) => {
  const response = await apiClient.put(`/users/me/decks/${deckId}/topics/${topicId}`, data)
  return response.data
}

/**
 * Xóa topic cá nhân
 * @param {string} deckId ID của deck
 * @param {string} topicId ID của topic
 */
export const deleteUserTopic = async (deckId, topicId) => {
  const response = await apiClient.delete(`/users/me/decks/${deckId}/topics/${topicId}`)
  return response.data
}

/**
 * Lấy danh sách card cá nhân thuộc topic
 * @param {string} deckId ID của deck
 * @param {string} topicId ID của topic
 * @param {Object} params các tham số phân trang
 */
export const getUserTopicCards = async (deckId, topicId, params = {}) => {
  const response = await apiClient.get(`/users/me/decks/${deckId}/cards`, {
    params: { topicId, ...params }
  })
  return response.data
}

/**
 * Tạo card mới cá nhân
 * @param {string} deckId ID của deck
 * @param {Object} data payload gồm topicId, term, translation, definition, example, pos
 */
export const createUserCard = async (deckId, data) => {
  const response = await apiClient.post(`/users/me/decks/${deckId}/cards`, data)
  return response.data
}

/**
 * Cập nhật card cá nhân
 * @param {string} deckId ID của deck
 * @param {string} cardId ID của card
 * @param {Object} data payload gồm term, translation, definition, example, pos
 */
export const updateUserCard = async (deckId, cardId, data) => {
  const response = await apiClient.put(`/users/me/decks/${deckId}/cards/${cardId}`, data)
  return response.data
}

/**
 * Xóa card cá nhân
 * @param {string} deckId ID của deck
 * @param {string} cardId ID của card
 */
export const deleteUserCard = async (deckId, cardId) => {
  const response = await apiClient.delete(`/users/me/decks/${deckId}/cards/${cardId}`)
  return response.data
}

/**
 * Tìm kiếm các từ có sẵn của hệ thống
 * @param {Object} params gồm q và limit
 */
export const searchSystemVocabulary = async (params = {}) => {
  const response = await apiClient.get('/vocabulary/search', { params })
  return response.data
}

/**
 * Lấy danh sách các thẻ đến hạn ôn tập (due card states) của người dùng hiện tại
 * @param {Object} params gồm các tham số lọc như page, limit, do mặc định due=true
 */
export const getUserDueCardStates = async (params = {}) => {
  const response = await apiClient.get('/users/me/card-states', {
    params: { ...params }
  })
  return response.data
}

/**
 * Xuất danh sách card trong topic ra file Excel
 * @param {string} deckId ID của bộ từ
 * @param {string} topicId ID của chủ đề
 */
export const exportUserTopicCards = async (deckId, topicId) => {
  const response = await apiClient.get(`/users/me/decks/${deckId}/topics/${topicId}/export`, {
    responseType: 'blob'
  })
  return response.data
}

/**
 * Nhập danh sách card từ file Excel vào topic
 * @param {string} deckId ID của bộ từ
 * @param {string} topicId ID của chủ đề
 * @param {Object} data payload gồm fileUrl và mode
 */
export const importUserTopicCards = async (deckId, topicId, data) => {
  const response = await apiClient.post(`/users/me/decks/${deckId}/topics/${topicId}/import`, data)
  return response.data
}
