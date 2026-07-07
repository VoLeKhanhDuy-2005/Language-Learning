import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import ConfirmModal from '../../src/components/ConfirmModal/ConfirmModal'

describe('ConfirmModal Component', () => {
  it('không hiển thị khi isOpen là false', () => {
    const { container } = render(
      <ConfirmModal
        isOpen={false}
        title="Xác nhận"
        message="Bạn có chắc không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('hiển thị đúng thông tin title, message, nút bấm khi isOpen là true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa không?"
        confirmText="Xác nhận"
        cancelText="Hủy bỏ"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Xác nhận xóa')).toBeInTheDocument()
    expect(screen.getByText('Bạn có chắc chắn muốn xóa không?')).toBeInTheDocument()
    expect(screen.getByText('Xác nhận')).toBeInTheDocument()
    expect(screen.getByText('Hủy bỏ')).toBeInTheDocument()
  })

  it('gọi onCancel khi click nút Cancel hoặc nút Close', async () => {
    const handleCancel = vi.fn()
    render(
      <ConfirmModal
        isOpen={true}
        title="Xác nhận"
        message="Thông điệp"
        confirmText="Đồng ý"
        cancelText="Hủy"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    )

    const user = userEvent.setup()
    
    // Click nút Cancel
    const cancelBtn = screen.getByText('Hủy')
    await user.click(cancelBtn)
    expect(handleCancel).toHaveBeenCalledTimes(1)

    // Click nút Close (X)
    const closeBtn = screen.getByLabelText('Close')
    await user.click(closeBtn)
    expect(handleCancel).toHaveBeenCalledTimes(2)
  })

  it('gọi onConfirm khi click nút Confirm và disable các nút khi đang xử lý', async () => {
    // onConfirm trả về Promise để giả lập bất đồng bộ
    let resolvePromise
    const mockConfirmPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    const handleConfirm = vi.fn(() => mockConfirmPromise)
    const handleCancel = vi.fn()

    render(
      <ConfirmModal
        isOpen={true}
        title="Xác nhận"
        message="Thông điệp"
        confirmText="Đồng ý"
        cancelText="Hủy"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    )

    const user = userEvent.setup()
    const confirmBtn = screen.getByText('Đồng ý')
    const cancelBtn = screen.getByText('Hủy')
    const closeBtn = screen.getByLabelText('Close')

    // Click nút xác nhận
    await user.click(confirmBtn)
    expect(handleConfirm).toHaveBeenCalledTimes(1)

    // Kiểm tra xem các nút có bị disable khi đang submit
    expect(confirmBtn).toBeDisabled()
    expect(cancelBtn).toBeDisabled()
    expect(closeBtn).toBeDisabled()

    // Hoàn thành promise và bọc trong act
    await act(async () => {
      resolvePromise()
    })
    
    // Kiểm tra các nút phải được enable lại sau khi promise kết thúc
    expect(confirmBtn).not.toBeDisabled()
    expect(cancelBtn).not.toBeDisabled()
    expect(closeBtn).not.toBeDisabled()
  })

  it('áp dụng class confirm-danger khi isDanger là true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Xác nhận nguy hiểm"
        message="Hành động này có hại"
        confirmText="Xóa bỏ"
        cancelText="Hủy"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        isDanger={true}
      />
    )

    const confirmBtn = screen.getByText('Xóa bỏ')
    expect(confirmBtn).toHaveClass('confirm-danger')
  })
})
