import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import Filters from '../../src/components/Filters/Filters'

describe('Filters Component', () => {
  const cefrLevelsMock = [
    { _id: 'cefr-a1', label: 'A1' },
    { _id: 'cefr-a2', label: 'A2' },
    { _id: 'cefr-b1', label: 'B1' },
  ]

  const tagsMock = [
    { _id: 'tag-1', label: 'Travel' },
    { _id: 'tag-2', label: 'Business' },
  ]

  it('không hiển thị phần lọc trình độ khi cefrLevels rỗng và không hiển thị phần lọc chủ đề khi tags rỗng', () => {
    const { container } = render(
      <Filters cefrLevels={[]} tags={[]} />
    )
    expect(container.firstChild).toHaveClass('filters-wrapper')
    expect(container.firstChild.children.length).toBe(0)
  })

  it('chỉ render bộ lọc trình độ khi cefrLevels có dữ liệu và tags rỗng', () => {
    render(
      <Filters cefrLevels={cefrLevelsMock} tags={[]} />
    )

    // Lọc trình độ hiển thị
    expect(screen.getByText('filters.level')).toBeInTheDocument()
    expect(screen.getByText('A1')).toBeInTheDocument()
    expect(screen.getByText('A2')).toBeInTheDocument()
    expect(screen.getByText('B1')).toBeInTheDocument()

    // Lọc chủ đề không hiển thị
    expect(screen.queryByText('filters.topic')).not.toBeInTheDocument()
  })

  it('chỉ render bộ lọc chủ đề khi tags có dữ liệu và cefrLevels rỗng', () => {
    render(
      <Filters cefrLevels={[]} tags={tagsMock} />
    )

    // Lọc chủ đề hiển thị (bao gồm nút 'Tất cả' mặc định)
    expect(screen.getByText('filters.topic')).toBeInTheDocument()
    expect(screen.getByText('filters.all')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()

    // Lọc trình độ không hiển thị
    expect(screen.queryByText('filters.level')).not.toBeInTheDocument()
  })

  it('áp dụng class active cho các nút được chọn tương ứng', () => {
    render(
      <Filters
        cefrLevels={cefrLevelsMock}
        tags={tagsMock}
        selectedCefrLevelId="cefr-a2"
        selectedTagId="tag-1"
      />
    )

    const btnA1 = screen.getByText('A1')
    const btnA2 = screen.getByText('A2')
    const btnAllTags = screen.getByText('filters.all')
    const btnTravel = screen.getByText('Travel')

    expect(btnA1).not.toHaveClass('active')
    expect(btnA2).toHaveClass('active')
    expect(btnAllTags).not.toHaveClass('active')
    expect(btnTravel).toHaveClass('active')
  })

  it('gọi onCefrChange khi bấm vào một nút trình độ', async () => {
    const handleCefrChange = vi.fn()
    render(
      <Filters
        cefrLevels={cefrLevelsMock}
        tags={[]}
        selectedCefrLevelId={null}
        onCefrChange={handleCefrChange}
      />
    )

    const user = userEvent.setup()
    const btnB1 = screen.getByText('B1')
    await user.click(btnB1)

    expect(handleCefrChange).toHaveBeenCalledWith('cefr-b1')
  })

  it('gọi onTagChange khi bấm vào một nút chủ đề hoặc nút Tất cả', async () => {
    const handleTagChange = vi.fn()
    render(
      <Filters
        cefrLevels={[]}
        tags={tagsMock}
        selectedTagId="tag-2"
        onTagChange={handleTagChange}
      />
    )

    const user = userEvent.setup()
    
    // Click vào Travel
    const btnTravel = screen.getByText('Travel')
    await user.click(btnTravel)
    expect(handleTagChange).toHaveBeenLastCalledWith('tag-1')

    // Click vào Tất cả (All)
    const btnAll = screen.getByText('filters.all')
    await user.click(btnAll)
    expect(handleTagChange).toHaveBeenLastCalledWith(null)
  })
})
