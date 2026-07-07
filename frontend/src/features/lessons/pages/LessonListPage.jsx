import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getLessons, getCefrLevels, getTags } from '../lessonsApi'
import Filters from '../../../components/Filters/Filters'
import LessonCard from '../components/LessonCard'
import Pagination from '../../../components/Pagination/Pagination'
import './LessonListPage.css'

function LessonListPage({ onNavigate }) {
  const { t } = useTranslation()
  // States cho dữ liệu từ API
  const [lessons, setLessons] = useState([])
  const [cefrLevels, setCefrLevels] = useState([])
  const [tags, setTags] = useState([])
  const [selectedLesson, setSelectedLesson] = useState(null)

  // States cho bộ lọc và tìm kiếm
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedCefrLevelId, setSelectedCefrLevelId] = useState(null)
  const [selectedTagId, setSelectedTagId] = useState(null)

  // States cho phân trang và trạng thái tải
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(12) // Hiển thị 12 bài học trên mỗi trang
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch CEFR Levels và Tags
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cefrData, tagsData] = await Promise.all([
          getCefrLevels(),
          getTags()
        ])

        if (cefrData.success && Array.isArray(cefrData.data)) {
          setCefrLevels(cefrData.data)
        }

        if (tagsData.success && Array.isArray(tagsData.data)) {
          setTags(tagsData.data)
        }
      } catch (err) {
        console.error('Lỗi khi tải metadata:', err)
      }
    };
    fetchMetadata()
  }, [])

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page về 1 khi các bộ lọc thay đổi
  useEffect(() => {
    setPage(1)
  }, [debouncedSearchQuery, selectedCefrLevelId, selectedTagId])

  // Fetch danh sách bài học khi các điều kiện lọc hoặc trang thay đổi
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = {
          page,
          limit,
          q: debouncedSearchQuery || undefined,
          cefrLevelId: selectedCefrLevelId || undefined,
          tagId: selectedTagId || undefined
        }

        const response = await getLessons(params)
        if (response.success && response.data) {
          setLessons(response.data.lessons || [])
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1)
          }
        } else {
          setError(response.message || t('lessons.fetchError'))
        }
      } catch (err) {
        setError(t('lessons.serverError'))
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [page, limit, debouncedSearchQuery, selectedCefrLevelId, selectedTagId])

  // Xử lý click chọn trình độ CEFR
  const handleCefrClick = (levelId) => {
    if (selectedCefrLevelId === levelId) {
      setSelectedCefrLevelId(null)
    } else {
      setSelectedCefrLevelId(levelId)
    }
  }

  // Xử lý click chọn chủ đề (tag)
  const handleTagClick = (tagId) => {
    setSelectedTagId(tagId)
  }

  // Khi click vào lesson, tìm lesson tương ứng và mở modal chọn chế độ
  const handleLessonClick = (lessonId) => {
    const item = lessons.find((l) => l.lesson._id === lessonId)
    if (item) {
      setSelectedLesson(item.lesson)
    }
  }

  // Chuyển hướng theo chế độ học đã chọn
  const handleSelectMode = (mode) => {
    if (!selectedLesson) return
    const lessonId = selectedLesson._id
    setSelectedLesson(null)
    if (onNavigate) {
      onNavigate(`/lessons/${mode}/${lessonId}`)
    }
  }

  return (
    <div className="lessons-container">
      {/* Ô tìm kiếm */}
      <div className="search-section">
        <div className="search-bar-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              fill="currentColor"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder={t('lessons.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bộ lọc */}
      <Filters
        cefrLevels={cefrLevels}
        tags={tags}
        selectedCefrLevelId={selectedCefrLevelId}
        selectedTagId={selectedTagId}
        onCefrChange={handleCefrClick}
        onTagChange={handleTagClick}
      />

      {/* Danh sách bài học */}
      {loading ? (
        <div className="lessons-loading">
          <div className="spinner"></div>
          <p>{t('lessons.loading')}</p>
        </div>
      ) : error ? (
        <div className="lessons-error">
          <p>{error}</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="lessons-empty">
          <p>{t('lessons.empty')}</p>
        </div>
      ) : (
        <div className="lessons-grid">
          {lessons.map((item) => (
            <LessonCard
              key={item.lesson._id}
              lesson={item.lesson}
              userProgress={item.userProgress}
              cefrLevels={cefrLevels}
              tags={tags}
              onClick={handleLessonClick}
            />
          ))}
        </div>
      )}

      {/* Thanh Phân trang */}
      {!loading && !error && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}

      {/* Modal Chọn Chế độ học */}
      {selectedLesson && (
        <div className="modal-overlay" onClick={() => setSelectedLesson(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('lessons.selectModeTitle')}</h3>
              <p className="modal-subtitle">{selectedLesson.title}</p>
              <button className="modal-close-icon-btn" onClick={() => setSelectedLesson(null)} aria-label="Close">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Dictation Card */}
              <button
                className={`mode-select-card ${!selectedLesson.modes?.includes('dictation') ? 'disabled' : ''}`}
                onClick={() => selectedLesson.modes?.includes('dictation') && handleSelectMode('dictation')}
                disabled={!selectedLesson.modes?.includes('dictation')}
              >
                <div className="mode-card-icon-wrapper icon-blue">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="mode-card-info">
                  <h4 className="mode-card-title">Dictation</h4>
                  <p className="mode-card-desc">{t('lessons.dictationDesc')}</p>
                </div>
              </button>

              {/* Shadowing Card */}
              <button
                className={`mode-select-card ${!selectedLesson.modes?.includes('shadowing') ? 'disabled' : ''}`}
                onClick={() => selectedLesson.modes?.includes('shadowing') && handleSelectMode('shadowing')}
                disabled={!selectedLesson.modes?.includes('shadowing')}
              >
                <div className="mode-card-icon-wrapper icon-red">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path
                      d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.2 6 6.72V21h2v-3.28c3.28-.48 6-3.26 6-6.72h-1.7z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="mode-card-info">
                  <h4 className="mode-card-title">Shadowing</h4>
                  <p className="mode-card-desc">{t('lessons.shadowingDesc')}</p>
                </div>
              </button>
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setSelectedLesson(null)}>
                {t('lessons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LessonListPage
