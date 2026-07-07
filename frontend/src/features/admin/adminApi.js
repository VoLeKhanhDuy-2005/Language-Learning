import apiClient from "../../services/apiClient";

export const listAdminDecksApi = async (filters = {}) => {
  const response = await apiClient.get("/admin/decks", { params: filters });
  return response.data;
};

export const createAdminDeckApi = async (payload) => {
  const response = await apiClient.post("/admin/decks", payload);
  return response.data;
};

export const getAdminDeckByIdApi = async (id) => {
  const response = await apiClient.get(`/admin/decks/${id}`);
  return response.data;
};

export const updateAdminDeckApi = async (id, payload) => {
  const response = await apiClient.put(`/admin/decks/${id}`, payload);
  return response.data;
};

export const deleteAdminDeckApi = async (id) => {
  const response = await apiClient.delete(`/admin/decks/${id}`);
  return response.data;
};

export const listAdminLessonsApi = async (filters = {}) => {
  const response = await apiClient.get("/admin/lessons", { params: filters });
  return response.data;
};

export const createAdminLessonApi = async (payload) => {
  const response = await apiClient.post("/admin/lessons", payload);
  return response.data;
};

export const getAdminLessonByIdApi = async (id) => {
  const response = await apiClient.get(`/admin/lessons/${id}`);
  return response.data;
};

export const updateAdminLessonApi = async (id, payload) => {
  const response = await apiClient.put(`/admin/lessons/${id}`, payload);
  return response.data;
};

export const listCefrLevelsApi = async () => {
  const response = await apiClient.get("/cefr-levels");
  return response.data;
};

export const listTagsApi = async () => {
  const response = await apiClient.get("/tags");
  return response.data;
};

export const createTagApi = async (label) => {
  const response = await apiClient.post("/admin/tags", { label });
  return response.data;
};

export const updateTagApi = async (id, label) => {
  const response = await apiClient.put(`/admin/tags/${id}`, { label });
  return response.data;
};

export const deleteTagApi = async (id) => {
  const response = await apiClient.delete(`/admin/tags/${id}`);
  return response.data;
};

export const getDeckTopicsApi = async (deckId) => {
  const response = await apiClient.get(`/admin/decks/${deckId}/topics`);
  return response.data;
};

export const createDeckTopicApi = async (deckId, payload) => {
  const response = await apiClient.post(
    `/admin/decks/${deckId}/topics`,
    payload,
  );
  return response.data;
};

export const updateDeckTopicApi = async (deckId, topicId, payload) => {
  const response = await apiClient.put(
    `/admin/decks/${deckId}/topics/${topicId}`,
    payload,
  );
  return response.data;
};

export const deleteDeckTopicApi = async (deckId, topicId) => {
  const response = await apiClient.delete(
    `/admin/decks/${deckId}/topics/${topicId}`,
  );
  return response.data;
};

export const deleteMultipleDeckTopicsApi = async (deckId, topicIds) => {
  const response = await apiClient.delete(
    `/admin/decks/${deckId}/topics`,
    { data: { topicIds } },
  );
  return response.data;
};

export const reorderDeckTopicsApi = async (deckId, topics) => {
  const response = await apiClient.patch(
    `/admin/decks/${deckId}/topics/reorder`,
    { topics },
  );
  return response.data;
};

export const listDeckCardsApi = async (deckId, filters = {}) => {
  const response = await apiClient.get(`/admin/decks/${deckId}/cards`, {
    params: filters,
  });
  return response.data;
};

export const createDeckCardApi = async (deckId, payload) => {
  const response = await apiClient.post(
    `/admin/decks/${deckId}/cards`,
    payload,
  );
  return response.data;
};

export const getDeckCardByIdApi = async (deckId, cardId) => {
  const response = await apiClient.get(
    `/admin/decks/${deckId}/cards/${cardId}`,
  );
  return response.data;
};

export const updateDeckCardApi = async (deckId, cardId, payload) => {
  const response = await apiClient.put(
    `/admin/decks/${deckId}/cards/${cardId}`,
    payload,
  );
  return response.data;
};

export const reorderTopicCardsApi = async (topicId, cards) => {
  const response = await apiClient.patch(
    `/admin/topics/${topicId}/cards/reorder`,
    { cards },
  );
  return response.data;
};

export const deleteDeckCardApi = async (deckId, cardId) => {
  const response = await apiClient.delete(
    `/admin/decks/${deckId}/cards/${cardId}`,
  );
  return response.data;
};

export const deleteMultipleDeckCardsApi = async (deckId, cardIds) => {
  const response = await apiClient.delete(
    `/admin/decks/${deckId}/cards`,
    { data: { cardIds } },
  );
  return response.data;
};

export const autoFillCardApi = async (word) => {
  const response = await apiClient.post("/ai/cards/auto-fill", { word });
  return response.data;
};

export const listAdminLessonSegmentsApi = async (lessonId) => {
  const response = await apiClient.get(`/admin/lessons/${lessonId}/segments`);
  return response.data;
};

export const createAdminLessonSegmentApi = async (lessonId, payload) => {
  const response = await apiClient.post(
    `/admin/lessons/${lessonId}/segments`,
    payload,
  );
  return response.data;
};

export const getAdminLessonSegmentByIdApi = async (lessonId, segmentId) => {
  const response = await apiClient.get(
    `/admin/lessons/${lessonId}/segments/${segmentId}`,
  );
  return response.data;
};

export const updateAdminLessonSegmentApi = async (
  lessonId,
  segmentId,
  payload,
) => {
  const response = await apiClient.put(
    `/admin/lessons/${lessonId}/segments/${segmentId}`,
    payload,
  );
  return response.data;
};

export const deleteAdminLessonSegmentApi = async (lessonId, segmentId) => {
  const response = await apiClient.delete(
    `/admin/lessons/${lessonId}/segments/${segmentId}`,
  );
  return response.data;
};

export const deleteMultipleLessonSegmentsApi = async (lessonId, segmentIds) => {
  const response = await apiClient.delete(
    `/admin/lessons/${lessonId}/segments`,
    { data: { segmentIds } },
  );
  return response.data;
};

export const getAdminDashboardApi = async () => {
  const response = await apiClient.get("/admin/dashboard");
  return response.data;
};

export const listAdminUsersApi = async (filters = {}) => {
  const response = await apiClient.get("/admin/users", { params: filters });
  return response.data;
};

export const getAdminUserByIdApi = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
};

export const changeAdminUserStatusApi = async (userId, status, banReason) => {
  const response = await apiClient.patch(`/admin/users/${userId}/status`, {
    status,
    banReason,
  });
  return response.data;
};

export const changeAdminUserPasswordApi = async (userId, newPassword) => {
  const response = await apiClient.patch(`/admin/users/${userId}`, {
    newPassword,
  });
  return response.data;
};

export const exportAdminTopicCardsApi = async (deckId, topicId) => {
  const response = await apiClient.get(
    `/admin/decks/${deckId}/topics/${topicId}/export`,
    { responseType: 'blob' },
  );
  return response.data;
};

export const importAdminTopicCardsApi = async (deckId, topicId, data) => {
  const response = await apiClient.post(
    `/admin/decks/${deckId}/topics/${topicId}/import`,
    data,
  );
  return response.data;
};