import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AdminSidebar from '../components/AdminSidebar/AdminSidebar'
import AdminHeader from '../components/AdminHeader/AdminHeader'
import './AdminLayout.css'

function AdminLayout({ children, currentPath, onNavigate }) {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true'
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('admin_sidebar_collapsed', String(next))
      return next
    })
  }

  const handleToggleMobileSidebar = () => {
    setIsMobileOpen(prev => !prev)
  }

  return (
    <div className={`admin-layout ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileOpen ? 'mobile-sidebar-open' : ''}`}>
      <AdminSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />
      {isMobileOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} />
      )}
      <div className="admin-layout-main">
        <AdminHeader onNavigate={onNavigate} onToggleMobileSidebar={handleToggleMobileSidebar} />
        <div className="admin-layout-content">
          {children}
        </div>
        <footer className="admin-layout-footer">
          <span className="admin-footer-copyright">
            © 2026 MinLish Admin. All rights reserved.
          </span>
          <div className="admin-footer-links">
            <a href="/privacy" onClick={(e) => e.preventDefault()}>{t('footer.privacy')}</a>
            <a href="/terms" onClick={(e) => e.preventDefault()}>{t('footer.terms')}</a>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default AdminLayout
