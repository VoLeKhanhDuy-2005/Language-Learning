import apiClient from "../../services/apiClient";

export const getProfileStats = async () => {
  const response = await apiClient.get("/users/me/stats");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await apiClient.patch("/users/me/profile-update", data);
  return response.data;
};

export const getGamificationProfile = async () => {
  const response = await apiClient.get("/gamification/me");
  return response.data;
};

export const getMyRank = async () => {
  const response = await apiClient.get("/gamification/me/rank");
  return response.data;
};

export const getMyStreak = async () => {
  const response = await apiClient.get("/gamification/streak");
  return response.data;
};

export const getBattleHistory = async (page = 1, limit = 20) => {
  const response = await apiClient.get("/battle/history", {
    params: { page, limit },
  });
  return response.data;
};

export const getCardStates = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  if (params.starred) query.set("starred", params.starred);
  if (params.hidden) query.set("hidden", params.hidden);
  if (params.due) query.set("due", params.due);
  const response = await apiClient.get(
    `/users/me/card-states?${query.toString()}`,
  );
  return response.data;
};
