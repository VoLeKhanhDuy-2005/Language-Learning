import axios from 'axios'
import i18n from '../i18n'

const apiClient = axios.create({
  baseURL: import.meta.env.API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper chuyển đổi message dựa theo code từ API response
const mapApiResponse = (data, isError = false) => {
  if (!data) return data

  const code = data.code
  if (isError) {
    if (code) {
      const translationKey = `api.error.${code}`
      if (i18n.exists(translationKey)) {
        data.message = i18n.t(translationKey)
      } else {
        data.message = i18n.t('api.common.UNKNOWN_ERROR')
      }
    } else {
      data.message = data.message || i18n.t('api.common.UNKNOWN_ERROR')
    }
  } else {
    if (code) {
      const translationKey = `api.success.${code}`
      if (i18n.exists(translationKey)) {
        data.message = i18n.t(translationKey)
      }
    }
  }
  return data
}

// Request Interceptor: Gắn accessToken vào header Authorization
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Đăng ký callback khi refresh token để cập nhật cho các request song song
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response Interceptor: Tự động refresh token khi nhận mã lỗi 401
apiClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = mapApiResponse(response.data, false)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Nếu lỗi 401 và không phải request đăng nhập/đăng xuất/refresh
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Gọi API refresh token
        const response = await axios.post(
          `${import.meta.env.API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newAccessToken = response.data?.data?.accessToken

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken)
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          
          processQueue(null, newAccessToken)
          isRefreshing = false
          
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false

        // Refresh token thất bại -> Xoá thông tin đăng nhập ở client
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        
        // Phát sự kiện logout để cập nhật giao diện
        window.dispatchEvent(new Event('auth:logout'))
        
        // Chuyển hướng sang trang đăng nhập nếu không ở các trang auth công khai
        const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']
        if (!publicPaths.includes(window.location.pathname)) {
          window.history.pushState({}, '', '/login')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }

        if (refreshError.response && refreshError.response.data) {
          refreshError.response.data = mapApiResponse(refreshError.response.data, true)
        }

        return Promise.reject(refreshError)
      }
    }

    if (error.response && error.response.data) {
      error.response.data = mapApiResponse(error.response.data, true)
    } else {
      error.message = i18n.t('api.common.UNKNOWN_ERROR')
    }

    return Promise.reject(error)
  }
)

export default apiClient
