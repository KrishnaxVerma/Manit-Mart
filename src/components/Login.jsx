import { useState, useEffect } from 'react'
import {
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

// Strict institute email validation
const INSTITUTION_EMAIL_REGEX = /^[\w.-]+@([\w-]+\.)*manit\.ac\.in$/i
const GENERAL_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const [em, setEm] = useState('')
  const [pw, setPw] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [ld, setLd] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const nav = useNavigate()

  // Forgot password modal states
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [sendingReset, setSendingReset] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState('')

  // Check if ?forgot=true is passed via URL
  useEffect(() => {
    if (searchParams.get('forgot') === 'true') {
      setIsForgotModalOpen(true)
    }
  }, [searchParams])

  // Login submission
  const sub = async (e) => {
    e.preventDefault()
    setLd(true)
    try {
      await setPersistence(auth, browserSessionPersistence)
      await signInWithEmailAndPassword(auth, em.trim(), pw)
      toast.success('Logged in successfully!', { icon: '👋' })
      nav('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      let msg = 'Failed to sign in. Please verify your credentials.'
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please try again or reset your password.'
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please reset your password or try again later.'
      }
      toast.error(msg)
    } finally {
      setLd(false)
    }
  }

  // Open forgot password modal
  const handleOpenForgot = () => {
    setForgotEmail(em.trim()) // Pre-fill with whatever email was already typed in login
    setResetError('')
    setResetSuccess(false)
    setIsForgotModalOpen(true)
  }

  // Close forgot password modal
  const handleCloseForgot = () => {
    setIsForgotModalOpen(false)
    setResetError('')
    setResetSuccess(false)
    if (searchParams.get('forgot')) {
      searchParams.delete('forgot')
      setSearchParams(searchParams)
    }
  }

  // Step 1: Submit password reset email request
  const handleSendResetEmail = async (e) => {
    e?.preventDefault()
    const sanitizedEmail = forgotEmail.trim()

    if (!sanitizedEmail) {
      setResetError('Please enter your institute email address.')
      return
    }

    if (!GENERAL_EMAIL_REGEX.test(sanitizedEmail)) {
      setResetError('Please enter a valid email address.')
      return
    }

    if (!INSTITUTION_EMAIL_REGEX.test(sanitizedEmail)) {
      // Show helpful note if email does not end with manit.ac.in
      toast('Please ensure this is your registered MANIT email address.', { icon: 'ℹ️' })
    }

    setSendingReset(true)
    setResetError('')

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true
      }

      await sendPasswordResetEmail(auth, sanitizedEmail, actionCodeSettings)
      setResetSuccess(true)
      toast.success('Password reset link sent! Check your inbox.', { icon: '📧' })
    } catch (err) {
      console.error('Password reset email error:', err)
      let msg = 'Failed to send reset link. Please try again.'
      if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please check your spelling or sign up.'
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.'
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many requests. Please wait a few moments before trying again.'
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network error. Please check your internet connection.'
      }
      setResetError(msg)
    } finally {
      setSendingReset(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700/80 p-8 shadow-xl">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MANIT Mart
            </span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
            Welcome Back
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Sign in with your campus credentials to continue
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={sub} className="space-y-4">
          
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              College Email
            </label>
            <input
              type="email"
              value={em}
              onChange={(e) => setEm(e.target.value)}
              placeholder="e.g. yourname@stu.manit.ac.in"
              className="input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
              required
            />
          </div>

          {/* Password with Forgot Password link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Password
              </label>
              <button
                type="button"
                onClick={handleOpenForgot}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                className="input input-bordered w-full pr-10 bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
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

          {/* Submit */}
          <button
            type="submit"
            disabled={ld}
            className="btn btn-primary w-full text-white rounded-xl shadow-md font-bold text-sm mt-2"
          >
            {ld ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>Signing in...</span>
              </>
            ) : (
              'Login'
            )}
          </button>

          {/* Footer Link */}
          <div className="text-center pt-3 text-xs text-gray-600 dark:text-gray-400">
            <span>Not registered yet? </span>
            <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </form>
      </div>

      {/* ================= FORGOT PASSWORD DAISYUI MODAL ================= */}
      {isForgotModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={handleCloseForgot}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseForgot}
              className="btn btn-ghost btn-circle btn-sm absolute right-4 top-4 text-gray-400 hover:text-gray-700 dark:hover:text-white"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Modal Content */}
            {!resetSuccess ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl shrink-0">
                    🔐
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Forgot Password?
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      We will send a secure password reset link to your email.
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {resetError && (
                  <div className="alert alert-error text-xs rounded-2xl py-2.5 px-3 mb-4 shadow-xs">
                    <span>{resetError}</span>
                  </div>
                )}

                <form onSubmit={handleSendResetEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                      Your Registered College Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value)
                        if (resetError) setResetError('')
                      }}
                      placeholder="e.g. scholar@stu.manit.ac.in"
                      className="input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
                      required
                      autoFocus
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Must be the email address you used to register on MANIT Mart.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseForgot}
                      className="btn btn-outline flex-1 rounded-xl dark:border-slate-600 dark:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingReset || !forgotEmail.trim()}
                      className="btn btn-primary flex-1 text-white rounded-xl shadow-md font-bold"
                    >
                      {sendingReset ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          <span>Sending...</span>
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Success Screen */
              <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl shadow-inner">
                  📬
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    Check Your Inbox
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    We sent a password reset link to:
                    <br />
                    <strong className="text-gray-900 dark:text-white font-mono text-sm block mt-1">
                      {forgotEmail}
                    </strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs text-left">
                  <p className="font-semibold mb-1">Next steps:</p>
                  <ol className="list-decimal list-inside space-y-0.5 opacity-90 text-[11px]">
                    <li>Open the email sent from Firebase / MANIT Mart.</li>
                    <li>Click the secure link inside the email.</li>
                    <li>Enter and confirm your new password.</li>
                  </ol>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 mt-2">
                    *Didn’t see it? Check your Spam or Promotions folder.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseForgot}
                    className="btn btn-primary w-full text-white rounded-xl shadow-md"
                  >
                    Back to Login
                  </button>
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={sendingReset}
                    className="btn btn-ghost btn-sm text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                  >
                    {sendingReset ? 'Sending...' : 'Resend Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
