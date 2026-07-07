import apiClient from '../../services/apiClient'

export const getBattleHistory = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/battle/history', {
    params: { page, limit }
  })
  return response.data
}

export const getBattleMatchById = async (matchId) => {
  const response = await apiClient.get(`/battle/${matchId}`)
  return response.data
}
