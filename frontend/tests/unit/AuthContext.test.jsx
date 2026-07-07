import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthProvider, useAuth } from '../../src/context/AuthContext'
import * as authApi from '../../src/features/auth/authApi'

// Mock tất cả các module api của auth
vi.mock('../../src/features/auth/authApi', () => ({
  loginApi: vi.fn(),
  signupApi: vi.fn(),
  verifyEmailApi: vi.fn(),
  resendVerifyEmailApi: vi.fn(),
  logoutApi: vi.fn(),
  refreshTokenApi: vi.fn(),
  forgotPasswordApi: vi.fn(),
  resetPasswordApi: vi.fn(),
}))

// Tạo một component con để Test Hook useAuth
const TestComponent = () => {
  const { user, accessToken, loading, login, logout } = useAuth()
  if (loading) return <div>Loading...</div>
  return (
    <div>
      <div data-testid="username">{user ? user.name : 'Guest'}</div>
      <div data-testid="token">{accessToken || 'No Token'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext & AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('khởi tạo loading là true và khôi phục phiên từ refresh token thành công', async () => {
    const mockUser = { id: '1', name: 'Triều Dương Trần', email: 'test@example.com' }
    const mockToken = 'new-access-token'
    
    // Giả lập refreshTokenApi thành công trả về token và user mới
    authApi.refreshTokenApi.mockResolvedValueOnce({
      success: true,
      data: { accessToken: mockToken, user: mockUser }
    })

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    // Sau khi tải xong, phải hiển thị đúng tên user và token từ API
    expect(screen.getByTestId('username')).toHaveTextContent('Triều Dương Trần')
    expect(screen.getByTestId('token')).toHaveTextContent('new-access-token')
    expect(localStorage.getItem('accessToken')).toBe('new-access-token')
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockUser)
  })

  it('đăng nhập thành công và lưu thông tin vào localStorage', async () => {
    const mockUser = { id: '2', name: 'Phú Hiển Văn', email: 'phu@example.com' }
    const mockToken = 'login-access-token'

    // Mock refresh token ban đầu thất bại để ở trạng thái chưa đăng nhập
    authApi.refreshTokenApi.mockRejectedValueOnce({
      response: { status: 401 }
    })

    // Mock login thành công
    authApi.loginApi.mockResolvedValueOnce({
      success: true,
      data: { accessToken: mockToken, user: mockUser }
    })

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    // Trạng thái ban đầu là Guest
    expect(screen.getByTestId('username')).toHaveTextContent('Guest')

    // Thực hiện click Đăng nhập
    const loginBtn = screen.getByText('Login')
    await act(async () => {
      loginBtn.click()
    })

    expect(authApi.loginApi).toHaveBeenCalledWith('test@example.com', 'password')
    expect(screen.getByTestId('username')).toHaveTextContent('Phú Hiển Văn')
    expect(screen.getByTestId('token')).toHaveTextContent('login-access-token')
    expect(localStorage.getItem('accessToken')).toBe('login-access-token')
  })

  it('đăng xuất và xóa sạch localStorage', async () => {
    const mockUser = { id: '3', name: 'Teo', email: 'teo@example.com' }
    
    // Set sẵn dữ liệu trong localStorage trước khi mount
    localStorage.setItem('accessToken', 'existing-token')
    localStorage.setItem('user', JSON.stringify(mockUser))

    authApi.refreshTokenApi.mockResolvedValueOnce({
      success: true,
      data: { accessToken: 'existing-token', user: mockUser }
    })

    authApi.logoutApi.mockResolvedValueOnce({ success: true })

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )
    })

    // Ban đầu hiển thị user hiện tại
    expect(screen.getByTestId('username')).toHaveTextContent('Teo')

    // Click nút đăng xuất
    const logoutBtn = screen.getByText('Logout')
    await act(async () => {
      logoutBtn.click()
    })

    // Thông tin biến mất
    expect(screen.getByTestId('username')).toHaveTextContent('Guest')
    expect(screen.getByTestId('token')).toHaveTextContent('No Token')
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
