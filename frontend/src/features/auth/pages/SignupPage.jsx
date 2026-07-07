import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Input from '../../../components/Input/Input'
import './SignupPage.css'

function SignupPage({ onNavigate }) {
  const { signup } = useAuth()
  const { t } = useTranslation()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const newErrors = {}

    if (!fullName.trim()) {
      newErrors.fullName = t('auth.nameEmptyError')
    }

    if (!email) {
      newErrors.email = t('auth.emailEmptyError')
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        newErrors.email = t('auth.emailInvalidError')
      }
    }

    if (!password) {
      newErrors.password = t('auth.passwordEmptyError')
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMinError')
    }

    if (password && confirmPassword !== password) {
      newErrors.confirmPassword = t('auth.confirmPasswordMismatch')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

    if (validate()) {
      setIsSubmitting(true)
      const result = await signup(fullName, email, password)
      setIsSubmitting(false)

      if (result.success) {
        if (onNavigate) onNavigate('/verify-email', email)
      } else {
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          const apiErrors = {}
          result.errors.forEach((err) => {
            const fieldMap = {
              name: 'fullName',
              email: 'email',
              password: 'password'
            }
            const localField = fieldMap[err.field] || err.field
            apiErrors[localField] = err.message
          })
          setErrors(apiErrors)
        } else {
          setGeneralError(result.message)
        }
      }
    }
  }

  const handleLoginClick = (e) => {
    e.preventDefault()
    if (onNavigate) onNavigate('/login')
  }

  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        <h2 className="signup-title">{t('auth.signupTitle')}</h2>
        <p className="signup-subtitle">{t('auth.signupSubtitle')}</p>

        {generalError && <div className="signup-error-message">{generalError}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          <Input
            id="fullName"
            label={t('auth.fullNameLabel')}
            type="text"
            placeholder={t('auth.fullNamePlaceholder')}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }))
            }}
            error={errors.fullName}
            disabled={isSubmitting}
          />

          <Input
            id="email"
            label={t('auth.emailLabel')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              e.target.setCustomValidity('')
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
              if (generalError) setGeneralError('')
            }}
            onInvalid={(e) => {
              if (!e.target.validity.valid) {
                e.target.setCustomValidity(t('auth.emailInvalidError'))
              }
            }}
            error={errors.email}
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
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
            }}
            error={errors.password}
            disabled={isSubmitting}
          />

          <Input
            id="confirmPassword"
            label={t('auth.confirmPasswordLabel')}
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }))
            }}
            error={errors.confirmPassword}
            disabled={isSubmitting}
          />

          <button type="submit" className="signup-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? t('auth.processing') : t('auth.signupBtn')}
          </button>
        </form>

        <div className="signup-footer">
          <span>{t('auth.hasAccount')}</span>
          <a href="/login" onClick={handleLoginClick} className="login-link">
            {t('auth.loginNow')}
          </a>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
