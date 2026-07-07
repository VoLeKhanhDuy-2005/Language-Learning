import apiClient from '../../services/apiClient'

/**
 * Lấy danh sách bài học đã công khai kèm theo phân trang và lọc
 * @param {Object} params các tham số lọc: tagId, cefrLevelId, mode, q, page, limit
 */
export const getLessons = async (params = {}) => {
  const response = await apiClient.get('/lessons', { params })
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
 * Lấy danh sách các tag dùng trong lesson để lọc
 */
export const getTags = async () => {
  const response = await apiClient.get('/tags', { params: { usedBy: 'lesson' } })
  return response.data
}

/**
 * Lấy thông tin chi tiết một bài học
 * @param {string} lessonId ID của bài học
 */
export const getLessonDetail = async (lessonId) => {
  const response = await apiClient.get(`/lessons/${lessonId}`)
  return response.data
}

/**
 * Lấy danh sách các segment kèm tiến độ học của bài học
 * @param {string} lessonId ID của bài học
 */
export const getLessonSegments = async (lessonId) => {
  const response = await apiClient.get(`/lessons/${lessonId}/segments`)
  return response.data
}

/**
 * Cập nhật tiến độ của một segment trong bài học
 * @param {string} lessonId ID của bài học
 * @param {string} segmentId ID của segment
 * @param {Object} payload Chứa thông tin tiến độ học
 */
export const patchSegmentProgress = async (lessonId, segmentId, payload) => {
  const response = await apiClient.patch(`/users/me/lessons/${lessonId}/segments/${segmentId}/progress`, payload)
  return response.data
}

