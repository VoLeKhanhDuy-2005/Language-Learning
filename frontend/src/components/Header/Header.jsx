import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import './Header.css'

function Header({ onNavigate, currentPath = window.location.pathname }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const dropdownRef = useRef(null)
  const moreDropdownRef = useRef(null)

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi'
    i18n.changeLanguage(nextLang)
    localStorage.setItem('lng', nextLang)
  }

  const handleClick = (path, e) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(path)
    }
    setIsDropdownOpen(false)
    setIsMoreOpen(false)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev)
  }

  const handleLogout = async (e) => {
    e.preventDefault()
    setIsDropdownOpen(false)
    await logout()
    if (onNavigate) {
      onNavigate('/login')
    }
  }

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Lấy chữ cái đầu của tên để làm avatar mặc định
  const getInitials = (name) => {
    if (!name) return 'U'
    return name.trim().charAt(0).toUpperCase()
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <a href="/" onClick={(e) => handleClick('/', e)} className="header-logo">
            MinLish
          </a>
          <nav className="header-nav">
            <a
              href="/lessons"
              onClick={(e) => handleClick('/lessons', e)}
              className={`header-nav-link ${currentPath.startsWith('/lessons') ? 'active' : ''}`}
            >
              {t('header.lessons')}
            </a>
            <a
              href="/decks"
              onClick={(e) => handleClick('/decks', e)}
              className={`header-nav-link ${currentPath.startsWith('/decks') ? 'active' : ''}`}
            >
              {t('header.vocabulary')}
            </a>
            <a
              href="/review"
              onClick={(e) => handleClick('/review', e)}
              className={`header-nav-link desktop-only ${currentPath.startsWith('/review') ? 'active' : ''}`}
            >
              {t('header.review')}
            </a>
            <a
              href="/battle"
              onClick={(e) => handleClick('/battle', e)}
              className={`header-nav-link desktop-only ${currentPath.startsWith('/battle') ? 'active' : ''}`}
            >
              {t('header.battle')}
            </a>
            <a
              href="/leaderboard"
              onClick={(e) => handleClick('/leaderboard', e)}
              className={`header-nav-link desktop-only ${currentPath.startsWith('/leaderboard') ? 'active' : ''}`}
            >
              {t('header.leaderboard')}
            </a>

            {/* Dropdown "More" cho mobile */}
            <div className="header-more-menu mobile-only" ref={moreDropdownRef}>
              <button 
                onClick={() => setIsMoreOpen((prev) => !prev)} 
                className={`header-nav-link header-more-btn ${(currentPath.startsWith('/review') || currentPath.startsWith('/battle') || currentPath.startsWith('/leaderboard')) ? 'active' : ''}`}
              >
                <span>{t('header.more')}</span>
                <svg className={`more-chevron ${isMoreOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" width="14" height="14">
                  <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>
              {isMoreOpen && (
                <div className="header-more-dropdown">
                  <a 
                    href="/review" 
                    onClick={(e) => handleClick('/review', e)} 
                    className={`dropdown-item ${currentPath.startsWith('/review') ? 'active' : ''}`}
                  >
                    {t('header.review')}
                  </a>
                  <a 
                    href="/battle" 
                    onClick={(e) => handleClick('/battle', e)} 
                    className={`dropdown-item ${currentPath.startsWith('/battle') ? 'active' : ''}`}
                  >
                    {t('header.battle')}
                  </a>
                  <a 
                    href="/leaderboard" 
                    onClick={(e) => handleClick('/leaderboard', e)} 
                    className={`dropdown-item ${currentPath.startsWith('/leaderboard') ? 'active' : ''}`}
                  >
                    {t('header.leaderboard')}
                  </a>
                </div>
              )}
            </div>
          </nav>
        </div>
        <div className="header-right">
          <button
            onClick={toggleLanguage}
            className="lang-toggle-btn"
            title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            aria-label="Toggle Language"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lang-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          {user ? (
            <div className="header-user-menu" ref={dropdownRef}>
              <button onClick={toggleDropdown} className="header-user-btn">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="header-avatar" />
                ) : (
                  <div className="header-avatar-placeholder">
                    {getInitials(user.name)}
                  </div>
                )}
                <span className="header-username">{user.name}</span>
                <svg
                  className={`header-chevron ${isDropdownOpen ? 'rotated' : ''}`}
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                >
                  <path
                    d="M7 10l5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="header-dropdown">
                  <a
                    href="/profile"
                    onClick={(e) => handleClick('/profile', e)}
                    className="dropdown-item"
                  >
                    <svg className="dropdown-icon" viewBox="0 0 24 24" width="16" height="16">
                      <path
                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>{t('header.profile')}</span>
                  </a>
                  <a
                    href="/profile/saved"
                    onClick={(e) => handleClick('/profile/saved', e)}
                    className="dropdown-item"
                  >
                    <svg className="dropdown-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{t('header.savedWords')}</span>
                  </a>
                  <button onClick={handleLogout} className="dropdown-item logout-btn">
                    <svg className="dropdown-icon" viewBox="0 0 24 24" width="16" height="16">
                      <path
                        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                        fill="currentColor"
                      />
                    </svg>
                    <span>{t('header.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="/login" onClick={(e) => handleClick('/login', e)} className="header-btn-login">
              {t('header.login')}
            </a>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
