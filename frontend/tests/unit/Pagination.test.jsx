import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import Pagination from '../../src/components/Pagination/Pagination'

describe('Pagination Component', () => {
  it('không hiển thị khi tổng số trang <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('hiển thị đầy đủ số trang khi tổng số trang <= 5', () => {
    render(
      <Pagination currentPage={2} totalPages={4} onPageChange={vi.fn()} />
    )

    // Kiểm tra các số trang hiển thị
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()

    // Kiểm tra trang hiện tại (active)
    const activePage = screen.getByText('2')
    expect(activePage).toHaveClass('active')
  })

  it('gọi onPageChange khi bấm vào một số trang', async () => {
    const handlePageChange = vi.fn()
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={handlePageChange} />
    )

    const user = userEvent.setup()
    const targetPage = screen.getByText('3')
    await user.click(targetPage)

    expect(handlePageChange).toHaveBeenCalledWith(3)
  })

  it('gọi onPageChange(currentPage - 1) khi click nút Previous', async () => {
    const handlePageChange = vi.fn()
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={handlePageChange} />
    )

    const user = userEvent.setup()
    const prevBtn = screen.getByLabelText('Previous Page')
    await user.click(prevBtn)

    expect(handlePageChange).toHaveBeenCalledWith(2)
  })

  it('gọi onPageChange(currentPage + 1) khi click nút Next', async () => {
    const handlePageChange = vi.fn()
    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={handlePageChange} />
    )

    const user = userEvent.setup()
    const nextBtn = screen.getByLabelText('Next Page')
    await user.click(nextBtn)

    expect(handlePageChange).toHaveBeenCalledWith(4)
  })

  it('vô hiệu hóa nút Previous ở trang đầu tiên và nút Next ở trang cuối cùng', () => {
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />
    )

    const prevBtn = screen.getByLabelText('Previous Page')
    const nextBtn = screen.getByLabelText('Next Page')

    expect(prevBtn).toBeDisabled()
    expect(nextBtn).not.toBeDisabled()

    // Rerender ở trang cuối cùng
    rerender(
      <Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />
    )

    expect(prevBtn).not.toBeDisabled()
    expect(nextBtn).toBeDisabled()
  })

  it('hiển thị dấu ba chấm và hỗ trợ chức năng nhảy trang', async () => {
    const handlePageChange = vi.fn()
    render(
      <Pagination currentPage={4} totalPages={10} onPageChange={handlePageChange} />
    )

    const user = userEvent.setup()
    
    // Kiểm tra hiển thị trang đầu (1), trang cuối (10), trang hiện tại (4) và các lân cận
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()

    // Kiểm tra sự xuất hiện của nút ellipsis nhảy trang
    const ellipsisBtns = screen.getAllByRole('button', { name: /jumpToPage|.../ })
    
    // Bấm vào dấu ba chấm ở cuối
    await user.click(ellipsisBtns[1])

    // Nó sẽ render input nhập trang
    const input = screen.getByPlaceholderText('...')
    expect(input).toBeInTheDocument()

    // Nhập số trang và nhấn Enter
    await user.type(input, '8{enter}')
    expect(handlePageChange).toHaveBeenCalledWith(8)
  })
})
