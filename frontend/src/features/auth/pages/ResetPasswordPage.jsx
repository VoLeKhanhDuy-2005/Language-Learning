import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Input from '../../../components/Input/Input'
import './ResetPasswordPage.css'

function ResetPasswordPage({ email = 'user@example.com', onNavigate }) {
  const { resetPassword, forgotPassword } = useAuth()
  const { t } = useTranslation()

  // State cho Step 1 (OTP)
  const [otp, setOtp] = useState(Array(6).fill(''))
  const cooldownSetting = Number(import.meta.env.OTP_RESEND_COOLDOWN) || 60
  const [timeLeft, setTimeLeft] = useState(cooldownSetting)
  const otpInputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]

  // State cho Step 2 (Mật khẩu mới)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // State thông báo & loading
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tự động focus vào ô OTP đầu tiên khi render
  useEffect(() => {
    if (otpInputRefs[0].current) {
      otpInputRefs[0].current.focus()
    }
  }, [])

  // Đếm ngược gửi lại mã OTP
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  // Xử lý khi thay đổi giá trị ô OTP
  const handleOtpChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return // Chỉ nhận số

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (error) setError('')

    // Tự động chuyển focus sang ô tiếp theo
    if (value && index < 5) {
      otpInputRefs[index + 1].current.focus()
    }
  }

  // Xử lý phím Backspace trong ô OTP
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        otpInputRefs[index - 1].current.focus()
      } else if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
      if (error) setError('')
    }
  }

  // Xử lý dán (paste) chuỗi OTP 6 số
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(text)) {
      const newOtp = text.split('')
      setOtp(newOtp)
      otpInputRefs[5].current.focus()
      if (error) setError('')
    }
  }

  // Gửi lại mã OTP
  const handleResendOtp = async (e) => {
    e.preventDefault()
    if (timeLeft > 0) return

    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    const result = await forgotPassword(email)
    setIsSubmitting(false)

    if (result.success) {
      setSuccessMessage(result.message || t('auth.otpResentSuccess'))
      setTimeLeft(cooldownSetting)
      setOtp(Array(6).fill(''))
      if (otpInputRefs[0].current) {
        otpInputRefs[0].current.focus()
      }
    } else {
      setError(result.message)
    }
  }

  // Xử lý khi bấm nút Đặt lại/Cập nhật mật khẩu
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPasswordError('')
    setConfirmPasswordError('')
    setSuccessMessage('')

    // Validate mã OTP
    const otpCode = otp.join('')
    if (otpCode.length < 6) {
      setError(t('auth.otpRequired'))
      return
    }

    // Validate mật khẩu mới
    if (!newPassword) {
      setPasswordError(t('auth.newPasswordRequired'))
      return
    }
    if (newPassword.length < 6) {
      setPasswordError(t('auth.passwordMinError'))
      return
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t('auth.confirmPasswordMismatch'))
      return
    }

    setIsSubmitting(true)
    const result = await resetPassword(email, otpCode, newPassword)

    if (result.success) {
      setSuccessMessage(t('auth.resetSuccess'))
      setTimeout(() => {
        if (onNavigate) onNavigate('/login')
      }, 1500)
    } else {
      setIsSubmitting(false)
      setError(result.message)
    }
  }

  const handleEditEmail = (e) => {
    e.preventDefault()
    if (onNavigate) onNavigate('/forgot-password')
  }

  const handleBackToLogin = (e) => {
    e.preventDefault()
    if (onNavigate) onNavigate('/login')
  }

  return (
    <div className="reset-wrapper">
      <div className="reset-card">
        {/* Vòng tròn Shield-checkmark trên đỉnh Card */}
        <div className="reset-icon-container">
          <svg className="reset-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 11 2 2 4-4" />
          </svg>
        </div>

        <h2 className="reset-title">{t('auth.resetTitle')}</h2>
        <p className="reset-subtitle">{t('auth.resetSubtitle')}</p>

        {error && <div className="reset-error-message">{error}</div>}
        {successMessage && <div className="reset-success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="reset-form">

          {/* STEP 1: XÁC THỰC OTP */}
          <div className="step-section">
            <h3 className="step-title">
              <span className="step-number">1</span> {t('auth.step1Otp')}
            </h3>

            <div className="step-email-row">
              <a href="/forgot-password" onClick={handleEditEmail} className="edit-email-link">
                <svg className="edit-email-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                {t('auth.wrongEmailLink')}
              </a>
            </div>

            <p className="step-desc">{t('auth.step1Desc')}</p>

            <div className="otp-container" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  ref={otpInputRefs[index]}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="otp-box-field"
                  autoComplete="off"
                  inputMode="numeric"
                  disabled={isSubmitting}
                />
              ))}
            </div>

            <div className="otp-resend-row">
              {timeLeft > 0 ? (
                <span className="resend-cooldown-text">{t('auth.resendCooldown', { seconds: timeLeft })}</span>
              ) : (
                <a href="/" onClick={handleResendOtp} className="resend-link">
                  {t('auth.resendLink')}
                </a>
              )}
            </div>
          </div>

          <div className="step-divider"></div>

          {/* STEP 2: THIẾT LẬP MẬT KHẨU MỚI */}
          <div className="step-section">
            <h3 className="step-title">
              <span className="step-number">2</span> {t('auth.step2Password')}
            </h3>

            <Input
              id="newPassword"
              label={t('auth.newPasswordLabel')}
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (passwordError) setPasswordError('')
                if (error) setError('')
              }}
              error={passwordError}
            />

            <div style={{ marginTop: '16px' }}>
              <Input
                id="confirmPassword"
                label={t('auth.confirmNewPasswordLabel')}
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmPasswordError) setConfirmPasswordError('')
                  if (error) setError('')
                }}
                error={confirmPasswordError}
              />
            </div>

            {/* Hint Box */}
            <div className="password-hint-box">
              <svg className="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>{t('auth.passwordHint')}</span>
            </div>
          </div>

          <button type="submit" className="reset-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? t('auth.updating') : t('auth.resetBtn')}
          </button>
        </form>

        <div className="reset-footer">
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

export default ResetPasswordPage
