import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Header from '../../src/components/Header/Header'

// Thiết lập mock các hook của context
const mockUser = vi.fn()
const mockLogout = vi.fn()
const mockToggleTheme = vi.fn()
const mockTheme = vi.fn()
const mockChangeLanguage = vi.fn()
const mockLanguage = vi.fn()

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser(),
    logout: mockLogout,
  })
}))

vi.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: mockTheme(),
    toggleTheme: mockToggleTheme,
  })
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: mockChangeLanguage,
      language: mockLanguage(),
    },
  })
}))

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTheme.mockReturnValue('light')
    mockLanguage.mockReturnValue('vi')
  })

  it('render logo và các liên kết điều hướng cơ bản chính xác', () => {
    mockUser.mockReturnValue(null)

    render(<Header currentPath="/" />)

    // Kiểm tra logo
    const logoLink = screen.getByText('MinLish')
    expect(logoLink).toBeInTheDocument()
    expect(logoLink).toHaveAttribute('href', '/')

    // Kiểm tra các liên kết điều hướng
    expect(screen.getByText('header.lessons')).toBeInTheDocument()
    expect(screen.getByText('header.vocabulary')).toBeInTheDocument()
  })

  it('hiển thị nút Đăng nhập khi chưa đăng nhập và click kích hoạt điều hướng', async () => {
    mockUser.mockReturnValue(null)
    const handleNavigate = vi.fn()

    render(<Header onNavigate={handleNavigate} currentPath="/" />)

    // Kiểm tra sự xuất hiện của nút Đăng nhập
    const loginLink = screen.getByText('header.login')
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')

    const user = userEvent.setup()
    
    // Click vào Đăng nhập gọi onNavigate
    await user.click(loginLink)
    expect(handleNavigate).toHaveBeenCalledWith('/login')
  })

  it('hiển thị avatar/tên người dùng khi đã đăng nhập và xử lý dropdown menu', async () => {
    mockUser.mockReturnValue({
      name: 'Triều Dương Trần',
      email: 'test@example.com',
      avatarUrl: null
    })

    render(<Header currentPath="/" />)

    // Hiển thị tên
    expect(screen.getByText('Triều Dương Trần')).toBeInTheDocument()
    
    // Hiển thị chữ cái đầu vì avatarUrl là null
    expect(screen.getByText('T')).toBeInTheDocument()

    // Ban đầu dropdown chưa mở
    expect(screen.queryByText('header.profile')).not.toBeInTheDocument()

    const user = userEvent.setup()
    const userBtn = screen.getByRole('button', { name: /Triều Dương Trần/ })

    // Click vào để mở dropdown
    await user.click(userBtn)
    expect(screen.getByText('header.profile')).toBeInTheDocument()
    expect(screen.getByText('header.savedWords')).toBeInTheDocument()
    expect(screen.getByText('header.logout')).toBeInTheDocument()

    // Click ra ngoài để đóng dropdown
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('header.profile')).not.toBeInTheDocument()
  })

  it('click Đăng xuất gọi hàm logout và chuyển hướng sang login', async () => {
    mockUser.mockReturnValue({
      name: 'Phú Hiển Văn',
      email: 'phu@example.com',
      avatarUrl: null
    })
    const handleNavigate = vi.fn()

    render(<Header onNavigate={handleNavigate} currentPath="/" />)

    const user = userEvent.setup()
    const userBtn = screen.getByRole('button', { name: /Phú Hiển Văn/ })

    // Mở dropdown
    await user.click(userBtn)
    
    // Click nút Đăng xuất
    const logoutBtn = screen.getByText('header.logout')
    await user.click(logoutBtn)

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(handleNavigate).toHaveBeenCalledWith('/login')
  })

  it('nút đổi ngôn ngữ hoạt động bình thường', async () => {
    mockUser.mockReturnValue(null)
    mockLanguage.mockReturnValue('vi')

    render(<Header currentPath="/" />)

    const langBtn = screen.getByRole('button', { name: 'Toggle Language' })
    expect(langBtn).toHaveTextContent('VI')

    const user = userEvent.setup()
    
    // Click đổi ngôn ngữ (vi -> en)
    await user.click(langBtn)
    expect(mockChangeLanguage).toHaveBeenCalledWith('en')
  })

  it('nút đổi theme hoạt động bình thường', async () => {
    mockUser.mockReturnValue(null)
    mockTheme.mockReturnValue('light')

    render(<Header currentPath="/" />)

    const themeBtn = screen.getByRole('button', { name: 'Toggle Theme' })
    const user = userEvent.setup()
    
    // Click đổi theme
    await user.click(themeBtn)
    expect(mockToggleTheme).toHaveBeenCalledTimes(1)
  })
})
