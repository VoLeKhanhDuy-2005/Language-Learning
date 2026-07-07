import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ImportExportModal from '../../src/features/flashcards/components/ImportExportModal'
import * as api from '../../src/features/flashcards/flashcardsApi'
import * as s3Upload from '../../src/utils/s3Upload'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (options && options.count !== undefined) {
        return `${key} count:${options.count}`
      }
      if (options && options.topicName !== undefined) {
        return `${key} topicName:${options.topicName}`
      }
      return key
    }
  })
}))

// Mock API calls
vi.mock('../../src/features/flashcards/flashcardsApi', () => ({
  exportUserTopicCards: vi.fn(),
  importUserTopicCards: vi.fn()
}))

vi.mock('../../src/utils/s3Upload', () => ({
  getPresignedUrl: vi.fn()
}))

describe('ImportExportModal Component', () => {
  const mockTopic = {
    _id: 'topic123',
    name: 'IELTS Wordlist'
  }
  const mockDeckId = 'deck456'
  const mockOnClose = vi.fn()
  const mockOnImportSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('render modal chính xác ở tab Xuất mặc định', () => {
    render(
      <ImportExportModal
        deckId={mockDeckId}
        topic={mockTopic}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    )

    // Kiểm tra các thông tin tiêu đề và tab
    expect(screen.getByText('userDeckDetail.importExportModalTitle')).toBeInTheDocument()
    expect(screen.getByText('userDeckDetail.exportTab')).toBeInTheDocument()
    expect(screen.getByText('userDeckDetail.importTab')).toBeInTheDocument()
    
    // Kiểm tra nội dung tả trong tab export
    expect(screen.getByText(/userDeckDetail.cardsInTopic topicName:IELTS Wordlist/)).toBeInTheDocument()
    
    // Nút submit xuất Excel hiển thị
    expect(screen.getByText('userDeckDetail.exportBtn')).toBeInTheDocument()
  })

  it('chuyển tab hoạt động bình thường', async () => {
    render(
      <ImportExportModal
        deckId={mockDeckId}
        topic={mockTopic}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    )

    const user = userEvent.setup()
    
    // Click sang tab Nhập
    const importTab = screen.getByText('userDeckDetail.importTab')
    await user.click(importTab)

    // Đã chuyển sang giao diện nhập từ vựng
    expect(screen.getByText('userDeckDetail.downloadTemplateBtn')).toBeInTheDocument()
    expect(screen.getByText('userDeckDetail.importModeLabel')).toBeInTheDocument()
    expect(screen.getByText('userDeckDetail.importBtn')).toBeInTheDocument()
  })

  it('click đóng modal gọi onClose', async () => {
    render(
      <ImportExportModal
        deckId={mockDeckId}
        topic={mockTopic}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    )

    const user = userEvent.setup()
    
    // Click nút Close (X)
    const closeBtn = screen.getByLabelText('Close')
    await user.click(closeBtn)
    expect(mockOnClose).toHaveBeenCalledTimes(1)

    // Click Cancel
    const cancelBtn = screen.getByText('decks.cancelBtn')
    await user.click(cancelBtn)
    expect(mockOnClose).toHaveBeenCalledTimes(2)
  })

  it('gọi API export khi click nút xuất Excel', async () => {
    const mockExportBlob = new Blob(['dummy excel data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    vi.mocked(api.exportUserTopicCards).mockResolvedValue(mockExportBlob)

    // Mock URL.createObjectURL và URL.revokeObjectURL
    const originalCreateObjectURL = window.URL.createObjectURL
    const originalRevokeObjectURL = window.URL.revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()

    render(
      <ImportExportModal
        deckId={mockDeckId}
        topic={mockTopic}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    )

    const user = userEvent.setup()
    const exportBtn = screen.getByText('userDeckDetail.exportBtn')
    
    await user.click(exportBtn)

    expect(api.exportUserTopicCards).toHaveBeenCalledWith(mockDeckId, mockTopic._id)
    expect(window.URL.createObjectURL).toHaveBeenCalled()

    // Khôi phục URL mock
    window.URL.createObjectURL = originalCreateObjectURL
    window.URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('gọi API import và hiển thị kết quả sau khi nhập thành công', async () => {
    // Mock getPresignedUrl
    vi.mocked(s3Upload.getPresignedUrl).mockResolvedValue({
      success: true,
      data: {
        uploadUrl: 'http://s3.mock/upload',
        url: 'http://s3.mock/file.xlsx'
      }
    })

    // Mock fetch upload
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    const originalFetch = window.fetch
    window.fetch = mockFetch

    // Mock importUserTopicCards
    vi.mocked(api.importUserTopicCards).mockResolvedValue({
      success: true,
      data: {
        summary: {
          totalRows: 5,
          inserted: 3,
          updated: 2,
          skipped: 0,
          failed: 0,
          errors: []
        }
      }
    })

    render(
      <ImportExportModal
        deckId={mockDeckId}
        topic={mockTopic}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    )

    const user = userEvent.setup()
    
    // Switch to Import Tab
    await user.click(screen.getByText('userDeckDetail.importTab'))

    // Create a fake file
    const file = new File(['fake content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const fileInput = document.querySelector('input[type="file"]')
    await user.upload(fileInput, file)

    // Click Import button
    const importBtn = screen.getByText('userDeckDetail.importBtn')
    await user.click(importBtn)

    // Verify S3 and Backend API calls
    expect(s3Upload.getPresignedUrl).toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledWith('http://s3.mock/upload', expect.any(Object))
    expect(api.importUserTopicCards).toHaveBeenCalledWith(mockDeckId, mockTopic._id, {
      fileUrl: 'http://s3.mock/file.xlsx',
      mode: 'append'
    })

    // Verify results displayed
    expect(await screen.findByText('userDeckDetail.importSuccessMsg')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // totalRows
    expect(screen.getByText('3')).toBeInTheDocument() // inserted
    expect(screen.getByText('2')).toBeInTheDocument() // updated

    expect(mockOnImportSuccess).toHaveBeenCalled()

    // Clean up
    window.fetch = originalFetch
  })
})
