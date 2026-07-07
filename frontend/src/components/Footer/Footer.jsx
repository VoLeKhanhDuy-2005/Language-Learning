import { useTranslation } from 'react-i18next'
import './Footer.css'

function Footer({ onNavigate }) {
  const { t } = useTranslation()
  const handleClick = (path, e) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(path)
    }
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <span className="footer-logo">MinLish</span>
          <span className="footer-copyright">
            © 2026 MinLish. Modern Academic Premium Learning.
          </span>
        </div>
        <nav className="footer-right">
          <a href="/" onClick={(e) => handleClick('/', e)} className="footer-link">
            {t('footer.about')}
          </a>
          <a href="/" onClick={(e) => handleClick('/', e)} className="footer-link">
            {t('footer.privacy')}
          </a>
          <a href="/" onClick={(e) => handleClick('/', e)} className="footer-link">
            {t('footer.terms')}
          </a>
          <a href="/" onClick={(e) => handleClick('/', e)} className="footer-link">
            {t('footer.contact')}
          </a>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
