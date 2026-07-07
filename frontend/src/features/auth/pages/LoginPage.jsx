import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Input from '../../../components/Input/Input'
import './LoginPage.css'

function LoginPage({ onNavigate }) {
  const { login, resendOtp } = useAuth()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError(t('auth.loginEmptyError'))
      return
    }

    setIsSubmitting(true)
    const result = await login(email, password)
    setIsSubmitting(false)

    if (result.success) {
      if (onNavigate) {
        if (result.user?.role === 'admin') {
          onNavigate('/admin')
        } else {
          onNavigate('/')
        }
      }
    } else {
      if (result.notVerified) {
        await resendOtp(email)
        if (onNavigate) onNavigate('/verify-email', email)
      } else {
        setError(result.message)
      }
    }
  }

  const handleSignupClick = (e) => {
    e.preventDefault()
    if (onNavigate) onNavigate('/signup')
  }

  const handleForgotPasswordClick = (e) => {
    e.preventDefault()
    if (onNavigate) onNavigate('/forgot-password')
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">{t('auth.loginTitle')}</h2>
        <p className="login-subtitle">{t('auth.loginSubtitle')}</p>

        {error && <div className="login-error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            id="email"
            label={t('auth.emailLabel')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              e.target.setCustomValidity('')
              if (error) setError('')
            }}
            onInvalid={(e) => {
              if (!e.target.validity.valid) {
                e.target.setCustomValidity(t('auth.emailInvalidError'))
              }
            }}
            disabled={isSubmitting}
          />

          <Input
            id="password"
            label={t('auth.passwordLabel')}
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            rightElement={
              <a href="/" onClick={handleForgotPasswordClick} tabIndex={-1}>
                {t('auth.forgotPasswordLink')}
              </a>
            }
            disabled={isSubmitting}
          />

          <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
            <span>{isSubmitting ? t('auth.loggingIn') : t('auth.loginBtn')}</span>
            {!isSubmitting && (
              <svg className="login-btn-icon" viewBox="0 0 24 24">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span>{t('auth.noAccount')}</span>
          <a href="/signup" onClick={handleSignupClick} className="register-link">
            {t('auth.registerNow')}
          </a>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
