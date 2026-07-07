import { useState, useEffect } from 'react'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import LoginPage from './features/auth/pages/LoginPage'
import SignupPage from './features/auth/pages/SignupPage'
import VerifyEmailPage from './features/auth/pages/VerifyEmailPage'
import LessonListPage from './features/lessons/pages/LessonListPage'
import DictationStudyPage from './features/lessons/pages/DictationStudyPage'
import ShadowingStudyPage from './features/lessons/pages/ShadowingStudyPage'
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage'
import DeckListPage from './features/flashcards/pages/DeckListPage'
import DeckDetailPage from './features/flashcards/pages/DeckDetailPage'
import UserDeckDetailPage from './features/flashcards/pages/UserDeckDetailPage'
import ReviewPage from './features/flashcards/pages/ReviewPage'
import SavedCardsPage from './features/flashcards/pages/SavedCardsPage'
import ProfilePage from './features/profile/pages/ProfilePage'
import BattleLobbyPage from './features/battle/pages/BattleLobbyPage'
import BattlePlayPage from './features/battle/pages/BattlePlayPage'
import LeaderboardPage from './features/gamification/pages/LeaderboardPage'
import AdminLayout from './features/admin/layout/AdminLayout'
import AdminDeckListPage from './features/admin/pages/deck/AdminDeckListPage'
import AdminDeckCreatePage from './features/admin/pages/deck/AdminDeckCreatePage'
import AdminDeckEditPage from './features/admin/pages/deck/AdminDeckEditPage'
import AdminDeckTopicPage from './features/admin/pages/topic/AdminDeckTopicPage'
import AdminCardListPage from './features/admin/pages/card/AdminCardListPage'
import AdminCardCreatePage from './features/admin/pages/card/AdminCardCreatePage'
import AdminCardEditPage from './features/admin/pages/card/AdminCardEditPage'
import AdminLessonListPage from './features/admin/pages/lesson/AdminLessonListPage'
import AdminLessonCreatePage from './features/admin/pages/lesson/AdminLessonCreatePage'
import AdminLessonEditPage from './features/admin/pages/lesson/AdminLessonEditPage'
import AdminLessonSegmentsPage from './features/admin/pages/lesson/AdminLessonSegmentsPage'
import AdminDashboardPage from './features/admin/pages/dashboard/AdminDashboardPage'
import AdminUsersPage from './features/admin/pages/user/AdminUsersPage'
import { useTranslation } from 'react-i18next'
import { useAuth } from './context/AuthContext'
import './App.css'


function App() {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [signupEmail, setSignupEmail] = useState('')
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')

  // Route guarding & redirection logic
  useEffect(() => {
    if (!loading) {
      if (user?.role === 'admin') {
        // Redirect admin users to admin dashboard if they visit public/user pages
        if (!currentPath.startsWith('/admin')) {
          navigate('/admin')
        }
      } else {
        // Redirect non-admin users to login if they try to access admin pages
        if (currentPath.startsWith('/admin')) {
          navigate('/login')
        }

        // Redirect unauthenticated users trying to access private user routes
        const privateUserPaths = ['/battle', '/battle/play', '/review', '/leaderboard']
        if (!user && (privateUserPaths.includes(currentPath) || currentPath.startsWith('/profile'))) {
          navigate('/login')
        }
      }
    }
  }, [user, loading, currentPath])

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path, param) => {
    const stateObj = (param && typeof param === 'object') ? param : {}
    window.history.pushState(stateObj, '', path)
    setCurrentPath(path)
    if (param && typeof param === 'string') {
      if (path === '/reset-password') {
        setForgotPasswordEmail(param)
      } else {
        setSignupEmail(param)
      }
    }
  }

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-spinner"></div>
      </div>
    )
  }

  const renderAdminContent = () => {
    if (currentPath === '/admin/lessons/new') {
      return <AdminLessonCreatePage onNavigate={navigate} />
    }
    if (currentPath.startsWith('/admin/lessons/') && currentPath.endsWith('/edit')) {
      const lessonId = currentPath.split('/')[3]
      return <AdminLessonEditPage onNavigate={navigate} lessonId={lessonId} />
    }
    if (currentPath.startsWith('/admin/lessons/') && currentPath.endsWith('/segments')) {
      const lessonId = currentPath.split('/')[3]
      return <AdminLessonSegmentsPage onNavigate={navigate} lessonId={lessonId} />
    }
    if (currentPath === '/admin/decks/new') {
      return <AdminDeckCreatePage onNavigate={navigate} />
    }
    // Match /admin/decks/:deckId/edit pattern
    const deckEditMatch = currentPath.match(/^\/admin\/decks\/([a-fA-F0-9]{24})\/edit$/)
    if (deckEditMatch) {
      const deckId = deckEditMatch[1]
      return <AdminDeckEditPage onNavigate={navigate} deckId={deckId} />
    }
    // Match /admin/decks/:deckId/topics/:topicId/cards/new pattern
    const cardCreateMatch = currentPath.match(/^\/admin\/decks\/([a-fA-F0-9]{24})\/topics\/([a-fA-F0-9]{24})\/cards\/new$/)
    if (cardCreateMatch) {
      const deckId = cardCreateMatch[1]
      const topicId = cardCreateMatch[2]
      return <AdminCardCreatePage onNavigate={navigate} deckId={deckId} topicId={topicId} />
    }
    // Match /admin/decks/:deckId/topics/:topicId/cards/:cardId/edit pattern
    const cardEditMatch = currentPath.match(/^\/admin\/decks\/([a-fA-F0-9]{24})\/topics\/([a-fA-F0-9]{24})\/cards\/([a-fA-F0-9]{24})\/edit$/)
    if (cardEditMatch) {
      const deckId = cardEditMatch[1]
      const topicId = cardEditMatch[2]
      const cardId = cardEditMatch[3]
      return <AdminCardEditPage onNavigate={navigate} deckId={deckId} topicId={topicId} cardId={cardId} />
    }
    // Match /admin/decks/:deckId/topics/:topicId/cards pattern
    const cardListMatch = currentPath.match(/^\/admin\/decks\/([a-fA-F0-9]{24})\/topics\/([a-fA-F0-9]{24})\/cards$/)
    if (cardListMatch) {
      const deckId = cardListMatch[1]
      const topicId = cardListMatch[2]
      return <AdminCardListPage onNavigate={navigate} deckId={deckId} topicId={topicId} />
    }
    // Match /admin/decks/:deckId pattern
    const deckDetailMatch = currentPath.match(/^\/admin\/decks\/([a-fA-F0-9]{24})$/)
    if (deckDetailMatch) {
      const deckId = deckDetailMatch[1]
      return <AdminDeckTopicPage onNavigate={navigate} deckId={deckId} />
    }
    if (currentPath.startsWith('/admin/decks')) {
      return <AdminDeckListPage onNavigate={navigate} />
    }
    if (currentPath === '/admin/lessons') {
      return <AdminLessonListPage onNavigate={navigate} />
    }
    if (currentPath.startsWith('/admin/lessons')) {
      return (
        <div style={{ padding: '40px', fontFamily: 'var(--font-family)', color: 'var(--color-on-surface-variant)' }}>
          {t('admin.lessonDetailPlaceholder')}
        </div>
      )
    }
    if (currentPath === '/admin/users') {
      return <AdminUsersPage onNavigate={navigate} />
    }
    // /admin or /admin/* -> render dashboard
    return <AdminDashboardPage onNavigate={navigate} />
  }

  const renderContent = () => {
    const lessonStudyMatch = currentPath.match(/^\/lessons\/(dictation|shadowing)\/([a-fA-F0-9]{24})$/)
    if (lessonStudyMatch) {
      const mode = lessonStudyMatch[1]
      const lessonId = lessonStudyMatch[2]
      if (mode === 'dictation') {
        return <DictationStudyPage lessonId={lessonId} onNavigate={navigate} />
      }
      if (mode === 'shadowing') {
        return <ShadowingStudyPage lessonId={lessonId} onNavigate={navigate} />
      }
    }

    const systemDeckMatch = currentPath.match(/^\/decks\/([a-fA-F0-9]{24})$/)
    if (systemDeckMatch) {
      const deckId = systemDeckMatch[1]
      return <DeckDetailPage deckId={deckId} isSystem={true} onNavigate={navigate} />
    }

    const userDeckMatch = currentPath.match(/^\/profile\/decks\/([a-fA-F0-9]{24})$/)
    if (userDeckMatch) {
      const deckId = userDeckMatch[1]
      return <UserDeckDetailPage deckId={deckId} onNavigate={navigate} />
    }

    switch (currentPath) {
      case '/login':
        return <LoginPage onNavigate={navigate} />
      case '/signup':
        return <SignupPage onNavigate={navigate} />
      case '/verify-email':
        return <VerifyEmailPage email={signupEmail} onNavigate={navigate} />
      case '/lessons':
        return <LessonListPage onNavigate={navigate} />
      case '/decks':
        return <DeckListPage onNavigate={navigate} />
      case '/review':
        return <ReviewPage onNavigate={navigate} />
      case '/profile':
        return <ProfilePage onNavigate={navigate} />
      case '/profile/saved':
        return <SavedCardsPage onNavigate={navigate} />
      case '/battle':
        return <BattleLobbyPage onNavigate={navigate} />
      case '/battle/play':
        return <BattlePlayPage onNavigate={navigate} />
      case '/forgot-password':
        return <ForgotPasswordPage onNavigate={navigate} />
      case '/reset-password':
        return <ResetPasswordPage email={forgotPasswordEmail} onNavigate={navigate} />
      case '/leaderboard':
        return <LeaderboardPage onNavigate={navigate} />
      default:
        return (
          <main className="main-content">
            {/* Hero Section */}
            <section className="section hero-section">
              <div className="hero-content">
                <div className="hero-badge">
                  <svg className="hero-badge-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
                  </svg>
                  <span>{t('home.heroBadge')}</span>
                </div>
                <h1 className="hero-title">
                  {t('home.heroTitle')}
                </h1>
                <p className="hero-desc">
                  {t('home.heroDesc')}
                </p>
                <a
                  href="/lessons"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate('/lessons')
                  }}
                  className="btn-primary"
                >
                  <span>{t('home.heroBtn')}</span>
                  <svg className="btn-icon" viewBox="0 0 24 24">
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </a>
              </div>
              <div className="hero-image-container">
                <img src="/hero.jpg" alt="MinLish Hero" className="hero-image" />
              </div>
            </section>

            {/* Features Section */}
            <section className="section features-section">
              <h2 className="section-title">{t('home.featuresTitle')}</h2>
              <p className="section-subtitle">{t('home.featuresSubtitle')}</p>
              <div className="features-grid">
                {/* Dictation Card */}
                <div className="feature-card">
                  <div className="feature-icon-wrapper icon-blue">
                    <svg className="feature-icon" viewBox="0 0 24 24">
                      <path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">{t('home.dictationTitle')}</h3>
                  <p className="feature-desc">
                    {t('home.dictationDesc')}
                  </p>
                </div>

                {/* Shadowing Card */}
                <div className="feature-card">
                  <div className="feature-icon-wrapper icon-red">
                    <svg className="feature-icon" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.2 6 6.72V21h2v-3.28c3.28-.48 6-3.26 6-6.72h-1.7z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">{t('home.shadowingTitle')}</h3>
                  <p className="feature-desc">
                    {t('home.shadowingDesc')}
                  </p>
                </div>

                {/* Flashcards Card */}
                <div className="feature-card">
                  <div className="feature-icon-wrapper icon-blue">
                    <svg className="feature-icon" viewBox="0 0 24 24">
                      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
                    </svg>
                  </div>
                  <h3 className="feature-title">{t('home.flashcardsTitle')}</h3>
                  <p className="feature-desc">
                    {t('home.flashcardsDesc')}
                  </p>
                </div>
              </div>
            </section>

            {/* Why Choose Section */}
            <section className="section why-section">
              <div className="why-image-container">
                <img src="/why-choose.jpg" alt="Why choose MinLish" className="why-image" />
              </div>
              <div className="why-content">
                <h2 className="why-title">{t('home.whyTitle')}</h2>
                <p className="why-desc">
                  {t('home.whyDesc')}
                </p>
                <div className="why-list">
                  <div className="why-item">
                    <div className="why-item-icon-wrapper icon-red">
                      <svg className="feature-icon" viewBox="0 0 24 24">
                        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-1.3l-.85-.6C7.8 13.1 7 11.5 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.5-1.1 4.1-2.15 5.1z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="why-item-title">{t('home.whyMethodTitle')}</h3>
                      <p className="why-item-desc">
                        {t('home.whyMethodDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="why-item">
                    <div className="why-item-icon-wrapper icon-blue">
                      <svg className="feature-icon" viewBox="0 0 24 24">
                        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="why-item-title">{t('home.whyProgressTitle')}</h3>
                      <p className="why-item-desc">
                        {t('home.whyProgressDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="section cta-section">
              <h2 className="cta-title">{t('home.ctaTitle')}</h2>
              <p className="cta-desc">
                {t('home.ctaDesc')}
              </p>
            </section>
          </main>
        )
    }
  }

  // Admin routes bypass public Header/Footer
  if (currentPath.startsWith('/admin')) {
    return (
      <AdminLayout currentPath={currentPath} onNavigate={navigate}>
        {renderAdminContent()}
      </AdminLayout>
    )
  }

  return (
    <>
      <Header onNavigate={navigate} currentPath={currentPath} />
      {renderContent()}
      <Footer onNavigate={navigate} />
    </>
  )
}

export default App
