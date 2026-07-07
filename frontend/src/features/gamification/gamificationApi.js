import apiClient from '../../services/apiClient'

export const getLeaderboardApi = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/gamification/leaderboard', {
    params: { page, limit }
  })
  return response.data
}

export const getMyRankApi = async () => {
  const response = await apiClient.get('/gamification/me/rank')
  return response.data
}
