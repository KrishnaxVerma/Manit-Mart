import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import { auth } from '../firebase'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const oobCode = searchParams.get('oobCode')
  const nav = useNavigate()

  // Verification states
  const [verifying, setVerifying] = useState(true)
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [codeError, setCodeError] = useState('')

  // Form states
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Step 2: Verify the one-time action code (oobCode) on mount
  useEffect(() => {
    if (!oobCode) {
      setCodeError('Missing password reset verification code. Please check your email link or request a new one.')
      setVerifying(false)
      return
    }

    const checkCode = async () => {
      setVerifying(true)
      setCodeError('')
      try {
        const email = await verifyPasswordResetCode(auth, oobCode)
        setVerifiedEmail(email)
      } catch (err) {
        console.error('Password reset code verification error:', err)
        let msg = 'This password reset link is invalid or has expired.'
        if (err.code === 'auth/expired-action-code') {
          msg = 'This password reset link has expired. Password reset links are time-limited for security.'
        } else if (err.code === 'auth/invalid-action-code') {
          msg = 'This reset link has already been used or is malformed.'
        }
        setCodeError(msg)
      } finally {
        setVerifying(false)
      }
    }

    checkCode()
  }, [oobCode])

  // Countdown timer on successful password update
  useEffect(() => {
    if (!submitSuccess) return
    if (countdown <= 0) {
      nav('/login')
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [submitSuccess, countdown, nav])

  // Step 3: Handle password submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (newPassword.length < 6) {
      setSubmitError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      setSubmitSuccess(true)
      toast.success('Password updated successfully! Redirecting to login...', { icon: '🎉' })
    } catch (err) {
      console.error('Confirm password reset error:', err)
      let msg = 'Failed to reset password. Please try again.'
      if (err.code === 'auth/expired-action-code') {
        msg = 'Your reset link expired while completing the form. Please request a new one.'
      } else if (err.code === 'auth/invalid-action-code') {
        msg = 'Invalid reset link. Please request a fresh reset link.'
      } else if (err.code === 'auth/weak-password') {
        msg = 'The password is too weak. Please use a stronger combination of characters.'
      }
      setSubmitError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const isPasswordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700/80 p-8 shadow-xl">
        
        {/* Brand / Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MANIT Mart
            </span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
            Reset Password
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Secure Student Campus Account Recovery
          </p>
        </div>

        {/* State 1: Verifying link */}
        {verifying && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <span className="loading loading-spinner loading-lg text-blue-600"></span>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Verifying security link...
            </p>
            <p className="text-xs text-gray-400">
              Checking token authenticity and expiration
            </p>
          </div>
        )}

        {/* State 2: Invalid or expired code */}
        {!verifying && codeError && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">⚠️</span>
                <div>
                  <h4 className="font-bold text-sm mb-1">Reset Link Expired or Invalid</h4>
                  <p className="leading-relaxed opacity-90">{codeError}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                to="/login?forgot=true"
                className="btn btn-primary w-full text-white rounded-xl shadow-md"
              >
                Request Fresh Reset Link
              </Link>
              <Link
                to="/login"
                className="btn btn-outline w-full rounded-xl dark:border-slate-600 dark:text-gray-200"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Password Reset Success */}
        {!verifying && !codeError && submitSuccess && (
          <div className="text-center py-4 space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-3xl shadow-inner">
              ✓
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                Password Updated!
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Your password for <strong>{verifiedEmail}</strong> has been successfully changed.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
              Redirecting you to login in {countdown}s...
            </div>

            <button
              type="button"
              onClick={() => nav('/login')}
              className="btn btn-primary w-full text-white rounded-xl shadow-md"
            >
              Proceed to Login Now
            </button>
          </div>
        )}

        {/* State 4: Valid code -> Show Form */}
        {!verifying && !codeError && !submitSuccess && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
            
            {/* Verified Email Banner */}
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Account:</span>
              <span className="font-semibold font-mono truncate ml-2">{verifiedEmail}</span>
            </div>

            {/* Error banner if submit failed */}
            {submitError && (
              <div className="alert alert-error text-xs rounded-xl py-2 px-3 shadow-xs">
                <span>{submitError}</span>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="input input-bordered w-full pr-10 bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showNewPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  minLength={6}
                  required
                  className={`input input-bordered w-full pr-10 bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm ${
                    isPasswordMismatch ? 'border-error ring-1 ring-error' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Match Status Helper */}
              {isPasswordMismatch && (
                <p className="text-xs text-error font-medium mt-1.5 flex items-center gap-1">
                  <span>✕</span> Passwords do not match.
                </p>
              )}
              {confirmPassword.length > 0 && !isPasswordMismatch && newPassword.length >= 6 && (
                <p className="text-xs text-success font-medium mt-1.5 flex items-center gap-1">
                  <span>✓</span> Passwords match.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || newPassword.length < 6 || isPasswordMismatch}
              className="btn btn-primary w-full text-white rounded-xl shadow-md font-bold text-sm disabled:bg-gray-300 dark:disabled:bg-slate-700"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Updating Password...</span>
                </>
              ) : (
                'Save New Password'
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
              >
                Cancel and return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
