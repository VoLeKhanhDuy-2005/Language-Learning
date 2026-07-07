import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Input from '../../../components/Input/Input'
import './ForgotPasswordPage.css'

function ForgotPasswordPage({ onNavigate }) {
  const { forgotPassword } = useAuth()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateEmail = (val) => {
    if (!val) {
      return t('auth.emailEmptyError')
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val)) {
      return t('auth.emailInvalidError')
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldError('')
    setSuccess('')

    const emailError = validateEmail(email)
    if (emailError) {
      setFieldError(emailError)
      return
    }

    setIsSubmitting(true)
    const result = await forgotPassword(email)

    if (result.success) {
      setSuccess(result.message || t('auth.otpSentSuccess'))
      setTimeout(() => {
        if (onNavigate) {
          // Chuyển hướng sang trang reset-password và truyền email qua tham số
          onNavigate('/reset-password', email)
        }
      }, 1500)
    } else {
      setIsSubmitting(false)
      setError(result.message)
    }
  }

  const handleBackToLogin = (e) => {
    e.preventDefault()
    if (onNavigate) onNavigate('/login')
  }

  return (
    <div className="forgot-wrapper">
      <div className="forgot-card">
        {/* Vòng tròn Icon xoay ngược */}
        <div className="forgot-icon-container">
          <svg className="forgot-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <circle cx="12" cy="12" r="1" />
          </svg>
        </div>

        <h2 className="forgot-title">{t('auth.forgotPasswordTitle')}</h2>
        <p className="forgot-subtitle">
          {t('auth.forgotPasswordSubtitle')}
        </p>

        {error && <div className="forgot-error-message">{error}</div>}
        {success && <div className="forgot-success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="forgot-form">
          <Input
            id="email"
            label={t('auth.emailLabel')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              e.target.setCustomValidity('')
              if (fieldError) setFieldError('')
              if (error) setError('')
            }}
            onInvalid={(e) => {
              if (!e.target.validity.valid) {
                e.target.setCustomValidity(t('auth.emailInvalidError'))
              }
            }}
            error={fieldError}
          />

          <button type="submit" className="forgot-submit-btn" disabled={isSubmitting}>
            <span>{isSubmitting ? t('auth.processing') : t('auth.forgotPasswordBtn')}</span>
            {!isSubmitting && (
              <svg className="forgot-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </form>

        <div className="forgot-footer">
          <a href="/login" onClick={handleBackToLogin} className="back-login-link">
            <svg className="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t('auth.backToLogin')}
          </a>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
