import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import './VerifyEmailPage.css'

function VerifyEmailPage({ email = 'user@example.com', onNavigate }) {
  const { verifyEmail, resendOtp } = useAuth()
  const { t } = useTranslation()
  const [otp, setOtp] = useState(Array(6).fill(''))
  const cooldownSetting = Number(import.meta.env.OTP_RESEND_COOLDOWN) || 60
  const [timeLeft, setTimeLeft] = useState(cooldownSetting)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]

  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus()
    }
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    
    if (error) setError('')

    if (value && index < 5) {
      inputRefs[index + 1].current.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs[index - 1].current.focus()
      } else if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
      if (error) setError('')
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(text)) {
      const newOtp = text.split('')
      setOtp(newOtp)
      inputRefs[5].current.focus()
      if (error) setError('')
    }
  }

  const handleResend = async (e) => {
    e.preventDefault()
    if (timeLeft > 0) return

    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)
    
    const result = await resendOtp(email)
    setIsSubmitting(false)

    if (result.success) {
      setSuccessMessage(result.message || t('auth.verifyOtpResentSuccess'))
      setTimeLeft(cooldownSetting)
    } else {
      setError(result.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    
    const otpCode = otp.join('')
    if (otpCode.length < 6) {
      setError(t('auth.verifyOtpRequired'))
      return
    }

    setIsSubmitting(true)
    const result = await verifyEmail(email, otpCode)
    setIsSubmitting(false)

    if (result.success) {
      setSuccessMessage(t('auth.verifySuccess'))
      setTimeout(() => {
        if (onNavigate) onNavigate('/login')
      }, 1500)
    } else {
      setError(result.message)
    }
  }

  const handleBackToLogin = (e) => {
    e.preventDefault()
    if (onNavigate) onNavigate('/login')
  }

  return (
    <div className="verify-wrapper">
      <div className="verify-card">
        <div className="verify-icon-container">
          <svg className="verify-icon" viewBox="0 0 24 24">
            <path
              d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h2 className="verify-title">{t('auth.verifyTitle')}</h2>
        <p className="verify-subtitle">
          {t('auth.verifySubtitle')}
          <span className="verify-email-text">{email}</span>
        </p>

        {error && <div className="verify-error-message">{error}</div>}
        {successMessage && <div className="verify-success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="verify-form">
          <div className="otp-container" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                ref={inputRefs[index]}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                autoComplete="off"
                inputMode="numeric"
                disabled={isSubmitting}
              />
            ))}
          </div>

          <button type="submit" className="verify-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? t('auth.processing') : t('auth.verifyBtn')}
          </button>
        </form>

        <div className="verify-footer">
          {timeLeft > 0 ? (
            <span className="resend-countdown">{t('auth.resendCooldown', { seconds: timeLeft })}</span>
          ) : (
            <a href="/" onClick={handleResend} className="resend-link">
              {t('auth.resendNowLink')}
            </a>
          )}

          <a href="/login" onClick={handleBackToLogin} className="back-login-link">
            <svg className="back-icon" viewBox="0 0 24 24">
              <path
                d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                fill="currentColor"
              />
            </svg>
            {t('auth.backToLogin')}
          </a>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage
