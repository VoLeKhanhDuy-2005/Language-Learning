import { useTranslation } from 'react-i18next'
import './AdminSidebar.css'

const NAV_ITEMS = [
  {
    key: 'overview',
    labelKey: 'admin.navOverview',
    path: '/admin',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'users',
    labelKey: 'admin.navUsers',
    path: '/admin/users',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'lessons',
    labelKey: 'admin.navLessons',
    path: '/admin/lessons',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    key: 'decks',
    labelKey: 'admin.navDecks',
    path: '/admin/decks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
]

function AdminSidebar({ currentPath, onNavigate, isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) {
  const { t } = useTranslation()

  const handleNav = (e, path) => {
    e.preventDefault()
    if (onNavigate) onNavigate(path)
    if (onCloseMobile) onCloseMobile()
  }

  const isActive = (path) => {
    if (path === '/admin') return currentPath === '/admin'
    return currentPath.startsWith(path)
  }

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-logo">
          <img src="/favicon.svg" alt="MinLish Logo" className="admin-sidebar-logo-img" />
        </div>
        <div className="admin-sidebar-brand-text">
          <div className="admin-sidebar-title">{t('admin.sidebarTitle')}</div>
          <div className="admin-sidebar-subtitle">{t('admin.sidebarSubtitle')}</div>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.key}
            href={item.path}
            onClick={(e) => handleNav(e, item.path)}
            className={`admin-sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
            title={isCollapsed ? t(item.labelKey) : undefined}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span className="admin-nav-label">{t(item.labelKey)}</span>
          </a>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button onClick={onToggleCollapse} className="admin-sidebar-collapse-btn" title={isCollapsed ? "Mở rộng" : "Thu gọn"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" className={`collapse-chevron-icon ${isCollapsed ? 'collapsed' : ''}`}>
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
          {!isCollapsed && <span></span>}
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
