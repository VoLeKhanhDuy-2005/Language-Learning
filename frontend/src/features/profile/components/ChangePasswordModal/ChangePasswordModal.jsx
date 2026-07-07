import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '../../../../components/Input/Input'
import { updateProfile } from '../../profileApi'
import './ChangePasswordModal.css'

function ChangePasswordModal({ onClose, onSuccess }) {
  const { t } = useTranslation()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [oldPwdError, setOldPwdError] = useState('')
  const [newPwdError, setNewPwdError] = useState('')
  const [confirmPwdError, setConfirmPwdError] = useState('')
  const [serverError, setServerError] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation realtime
  const validate = () => {
    let valid = true

    // Old password
    if (!oldPassword.trim()) {
      setOldPwdError(t('profile.oldPasswordRequired'))
      valid = false
    } else {
      setOldPwdError('')
    }

    // New password
    if (!newPassword.trim()) {
      setNewPwdError(t('profile.newPasswordRequired'))
      valid = false
    } else if (newPassword.length < 6) {
      setNewPwdError(t('profile.newPasswordMin'))
      valid = false
    } else {
      setNewPwdError('')
    }

    // Confirm password
    if (!confirmPassword.trim()) {
      setConfirmPwdError(t('profile.confirmPasswordRequired'))
      valid = false
    } else if (newPassword !== confirmPassword) {
      setConfirmPwdError(t('profile.confirmPasswordMismatch'))
      valid = false
    } else {
      setConfirmPwdError('')
    }

    return valid
  }

  const handleSubmit = async () => {
    setServerError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await updateProfile({
        oldPassword,
        newPassword,
        confirmPassword,
      })
      if (res.success) {
        onSuccess && onSuccess()
      } else {
        // Handle field-level errors from backend
        if (res.data?.errors) {
          res.data.errors.forEach((err) => {
            if (err.field === 'oldPassword') {
              setOldPwdError(t('profile.oldPasswordRequired'))
            } else if (err.field === 'newPassword') {
              setNewPwdError(t('profile.newPasswordRequired'))
            } else if (err.field === 'confirmPassword') {
              setConfirmPwdError(t('profile.confirmPasswordMismatch'))
            }
          })
        } else {
          setServerError(res.message || t('profile.passwordChangeFailed'))
        }
      }
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors && Array.isArray(errors)) {
        errors.forEach((e) => {
          if (e.field === 'oldPassword') setOldPwdError(t('profile.oldPasswordRequired'))
          else if (e.field === 'newPassword') setNewPwdError(t('profile.newPasswordRequired'))
          else if (e.field === 'confirmPassword') setConfirmPwdError(t('profile.confirmPasswordMismatch'))
        })
      } else {
        setServerError(err.response?.data?.message || t('profile.passwordChangeFailed'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = oldPassword.trim() && newPassword.trim() && confirmPassword.trim()

  return (
    <div className="cp-modal-overlay" onClick={onClose}>
      <div className="cp-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="cp-modal-header">
          <h3 className="cp-modal-title">{t('profile.changePasswordTitle')}</h3>
          <button className="cp-modal-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cp-modal-body">
          {serverError && <div className="cp-error-msg">{serverError}</div>}

          <Input
            id="cp-old-password"
            label={t('profile.oldPassword')}
            type="password"
            placeholder={t('profile.oldPasswordPlaceholder')}
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value)
              if (oldPwdError) setOldPwdError('')
              if (serverError) setServerError('')
            }}
            error={oldPwdError}
          />

          <Input
            id="cp-new-password"
            label={t('profile.newPassword')}
            type="password"
            placeholder={t('profile.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              if (newPwdError) setNewPwdError('')
              if (serverError) setServerError('')
            }}
            error={newPwdError}
          />

          <Input
            id="cp-confirm-password"
            label={t('profile.confirmPassword')}
            type="password"
            placeholder={t('profile.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (confirmPwdError) setConfirmPwdError('')
              if (serverError) setServerError('')
            }}
            error={confirmPwdError}
          />
        </div>

        <div className="cp-modal-footer">
          <button className="cp-btn cp-btn-cancel" onClick={onClose} disabled={isSubmitting}>
            {t('profile.cancel')}
          </button>
          <button
            className="cp-btn cp-btn-confirm"
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? t('profile.processing') : t('profile.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordModal