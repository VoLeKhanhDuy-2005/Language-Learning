import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import Input from '../../src/components/Input/Input'

describe('Input Component', () => {
  it('hiển thị đúng label, placeholder và value', () => {
    render(
      <Input
        label="Tên đăng nhập"
        placeholder="Nhập tên đăng nhập của bạn"
        value="trieuduong"
        onChange={vi.fn()}
        id="username-input"
      />
    )

    // Kiểm tra label và association
    const inputElement = screen.getByLabelText('Tên đăng nhập')
    expect(inputElement).toBeInTheDocument()
    expect(inputElement).toHaveAttribute('id', 'username-input')
    expect(inputElement).toHaveAttribute('placeholder', 'Nhập tên đăng nhập của bạn')
    expect(inputElement).toHaveValue('trieuduong')
  })

  it('gọi callback onChange khi người dùng nhập dữ liệu', async () => {
    const handleChange = vi.fn()
    render(
      <Input
        label="Email"
        value=""
        onChange={handleChange}
        id="email-input"
      />
    )

    const user = userEvent.setup()
    const inputElement = screen.getByLabelText('Email')
    await user.type(inputElement, 'a')

    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('hành vi toggle hiển thị mật khẩu khi type là password', async () => {
    render(
      <Input
        label="Mật khẩu"
        type="password"
        value="123456"
        onChange={vi.fn()}
        id="password-input"
      />
    )

    const inputElement = screen.getByLabelText('Mật khẩu')
    // Ban đầu input có type là password
    expect(inputElement).toHaveAttribute('type', 'password')

    // Lấy nút toggle hiển thị mật khẩu (nút toggle có aria-label tương ứng)
    const toggleBtn = screen.getByRole('button', { name: /input.showPassword/ })
    expect(toggleBtn).toBeInTheDocument()

    const user = userEvent.setup()
    
    // Click toggle hiển thị mật khẩu
    await user.click(toggleBtn)
    expect(inputElement).toHaveAttribute('type', 'text')
    // Button toggle thay đổi aria-label thành hide
    expect(toggleBtn).toHaveAttribute('aria-label', 'input.hidePassword')

    // Click toggle một lần nữa để ẩn mật khẩu
    await user.click(toggleBtn)
    expect(inputElement).toHaveAttribute('type', 'password')
    expect(toggleBtn).toHaveAttribute('aria-label', 'input.showPassword')
  })

  it('hiển thị thông điệp lỗi và áp dụng class lỗi khi có prop error', () => {
    render(
      <Input
        label="Email"
        value=""
        onChange={vi.fn()}
        id="email-input"
        error="Email không hợp lệ"
      />
    )

    // Kiểm tra thông báo lỗi hiển thị
    expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument()

    // Kiểm tra input có class báo lỗi
    const inputElement = screen.getByLabelText('Email')
    expect(inputElement).toHaveClass('input-error')
  })

  it('hiển thị rightElement ở góc trên cùng bên phải của nhãn label', () => {
    const rightElementMock = <span data-testid="right-elem">Quên mật khẩu?</span>
    render(
      <Input
        label="Mật khẩu"
        value=""
        onChange={vi.fn()}
        id="password-input"
        rightElement={rightElementMock}
      />
    )

    expect(screen.getByTestId('right-elem')).toBeInTheDocument()
    expect(screen.getByText('Quên mật khẩu?')).toBeInTheDocument()
  })

  it('truyền các thuộc tính props bổ sung xuống thẻ input', () => {
    render(
      <Input
        label="Tên"
        value=""
        onChange={vi.fn()}
        id="name-input"
        maxLength={10}
        disabled
      />
    )

    const inputElement = screen.getByLabelText('Tên')
    expect(inputElement).toHaveAttribute('maxLength', '10')
    expect(inputElement).toBeDisabled()
  })
})
