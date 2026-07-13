import apiClient from "../services/apiClient";

export const fetchFromDictionaryApi = async (word) => {
  try {
    const response = await apiClient.post("/ai/cards/dictionary-fill", {
      word,
    });
    if (response.data && response.data.success) {
      return { success: true, data: response.data.data };
    }
    return { success: false, message: response.data?.message || "Failed" };
  } catch (error) {
    console.error("Dictionary API Error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch from dictionary API",
    };
  }
};
