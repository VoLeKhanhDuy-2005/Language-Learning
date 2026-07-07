import { createContext, useContext, useState, useEffect } from 'react'
import { loginApi, signupApi, verifyEmailApi, resendVerifyEmailApi, logoutApi, refreshTokenApi, forgotPasswordApi, resetPasswordApi } from '../features/auth/authApi'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'))
  const [loading, setLoading] = useState(true)

  // Hàm tự động làm mới phiên đăng nhập khi mở trang
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Luôn thử gọi refresh token lúc khởi tạo để kiểm tra phiên từ cookie
        const response = await refreshTokenApi()
        if (response.success && response.data) {
          const { accessToken: newToken, user: newUser } = response.data
          // Lưu vào localStorage
          localStorage.setItem('accessToken', newToken)
          if (newUser) {
            localStorage.setItem('user', JSON.stringify(newUser))
            setUser(newUser)
          }
          setAccessToken(newToken)
        }
      } catch (error) {
        // Nếu refresh lỗi, kiểm tra xem có token cũ trong localStorage hay không
        // Nếu có mà lỗi 401 thì xoá đi để người dùng đăng nhập lại
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          setUser(null)
          setAccessToken(null)

          // Chuyển hướng sang trang đăng nhập nếu không ở các trang auth công khai
          const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']
          if (!publicPaths.includes(window.location.pathname)) {
            window.history.pushState({}, '', '/login')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }
        }
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Đăng ký lắng nghe sự kiện logout phát ra từ apiClient interceptor
    const handleGlobalLogout = () => {
      setUser(null)
      setAccessToken(null)
    }

    window.addEventListener('auth:logout', handleGlobalLogout)
    return () => window.removeEventListener('auth:logout', handleGlobalLogout)
  }, [])

  // Đăng nhập
  const login = async (email, password) => {
    try {
      const response = await loginApi(email, password)
      if (response.success && response.data) {
        const { accessToken: token, user: userData } = response.data
        localStorage.setItem('accessToken', token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        setAccessToken(token)
        return { success: true, user: userData }
      }
      return { success: false, message: response.message || 'Đăng nhập không thành công' }
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      const status = error.response?.status
      const isNotVerified =
        (status === 400 || status === 403) &&
        error.response?.data?.code === 'ACCOUNT_NOT_VERIFIED'

      return {
        success: false,
        message,
        notVerified: isNotVerified,
      }
    }
  }

  // Đăng ký
  const signup = async (name, email, password) => {
    try {
      const response = await signupApi(name, email, password)
      if (response.success) {
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message || 'Đăng ký thất bại' }
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại sau.'
      const apiErrors = error.response?.data?.errors || null
      return { success: false, message, errors: apiErrors }
    }
  }

  // Xác thực Email
  const verifyEmail = async (email, otp) => {
    try {
      const response = await verifyEmailApi(email, otp)
      if (response.success) {
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message || 'Mã xác thực không hợp lệ' }
    } catch (error) {
      const message = error.response?.data?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.'
      return { success: false, message }
    }
  }

  // Gửi lại mã xác thực
  const resendOtp = async (email) => {
    try {
      const response = await resendVerifyEmailApi(email)
      if (response.success) {
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message || 'Gửi lại mã thất bại' }
    } catch (error) {
      const message = error.response?.data?.message || 'Gửi lại mã thất bại. Vui lòng thử lại sau.'
      return { success: false, message }
    }
  }

  // Đăng xuất
  const logout = async () => {
    try {
      await logoutApi()
    } catch (error) {
      console.error('Lỗi khi gọi API đăng xuất:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      setUser(null)
      setAccessToken(null)
    }
  }

  // Quên mật khẩu
  const forgotPassword = async (email) => {
    try {
      const response = await forgotPasswordApi(email)
      if (response.success) {
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message || 'Gửi yêu cầu thất bại' }
    } catch (error) {
      const message = error.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại sau.'
      return { success: false, message }
    }
  }

  // Đặt lại mật khẩu
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await resetPasswordApi(email, otp, newPassword)
      if (response.success) {
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message || 'Đặt lại mật khẩu thất bại' }
    } catch (error) {
      const message = error.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại sau.'
      return { success: false, message }
    }
  }

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updatedFields }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        signup,
        verifyEmail,
        resendOtp,
        logout,
        forgotPassword,
        resetPassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider')
  }
  return context
}
