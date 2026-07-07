import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext'

// Component kiểm thử sử dụng context
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <div data-testid="theme-value">{theme}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  )
}

describe('ThemeContext & ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    vi.restoreAllMocks()
  })

  it('khởi tạo theme từ localStorage nếu có giá trị hợp lệ', () => {
    localStorage.setItem('theme', 'dark')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('khởi tạo theme light mặc định của hệ thống khi localStorage không có dữ liệu', () => {
    // Giả lập matchMedia trả về matches = false (hệ thống sáng)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
      })),
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('khởi tạo theme dark mặc định của hệ thống khi localStorage không có dữ liệu', () => {
    // Giả lập matchMedia trả về matches = true (hệ thống tối)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: true,
      })),
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('thay đổi theme và cập nhật localStorage cũng như thuộc tính DOM khi click Toggle Theme', async () => {
    // Giả lập hệ thống sáng
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
      })),
    })

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const toggleBtn = screen.getByText('Toggle Theme')
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')

    // Click đổi theme lần 1 (light -> dark)
    await act(async () => {
      toggleBtn.click()
    })

    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')

    // Click đổi theme lần 2 (dark -> light)
    await act(async () => {
      toggleBtn.click()
    })

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('ném ra lỗi khi dùng hook useTheme bên ngoài ThemeProvider', () => {
    // Tạm thời ẩn console.error để tránh pollute terminal log khi test ném lỗi chủ động
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme phải được sử dụng trong ThemeProvider')

    consoleSpy.mockRestore()
  })
})
