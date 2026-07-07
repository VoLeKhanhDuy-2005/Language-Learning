import apiClient from '../../services/apiClient'

export const loginApi = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password }, { withCredentials: true })
  return response.data
}

export const signupApi = async (name, email, password) => {
  const response = await apiClient.post('/auth/signup', { name, email, password })
  return response.data
}

export const verifyEmailApi = async (email, otp) => {
  const response = await apiClient.post('/auth/verify-email', { email, otp })
  return response.data
}

export const resendVerifyEmailApi = async (email) => {
  const response = await apiClient.post('/auth/verify-email/send', { email })
  return response.data
}

export const logoutApi = async () => {
  const response = await apiClient.post('/auth/logout', {}, { withCredentials: true })
  return response.data
}

export const refreshTokenApi = async () => {
  const response = await apiClient.post('/auth/refresh', {}, { withCredentials: true })
  return response.data
}

export const forgotPasswordApi = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email })
  return response.data
}

export const resetPasswordApi = async (email, otp, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', { email, otp, newPassword })
  return response.data
}

