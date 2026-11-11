import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import { auth, db, sendEmailVerification } from '../firebase'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Signup() {
  const [nm, setNm] = useState('')
  const [em, setEm] = useState('')
  const [pw, setPw] = useState('')
  const [ht, setHt] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [ld, setLd] = useState(false)
  const nav = useNavigate()

  const isValidEmail = (email) => {
    const trimmed = email.trim().toLowerCase()
    return trimmed.endsWith('@stu.manit.ac.in') || trimmed.endsWith('@manit.ac.in')
  }

  const sub = async (e) => {
    e.preventDefault()
    const sanitizedEmail = em.trim().toLowerCase()

    if (!isValidEmail(sanitizedEmail)) {
      toast.error('Only @stu.manit.ac.in or @manit.ac.in emails allowed')
      return
    }

    if (pw.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setLd(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, sanitizedEmail, pw)
      const u = cred.user
      const uid = u.uid
      
      // Save user profile to Firestore
      await setDoc(doc(db, 'users', uid), {
        name: nm.trim(),
        hostel: ht.trim(),
        role: 'student',
        email: sanitizedEmail,
        createdAt: new Date()
      })
      
      if (u.emailVerified) {
        toast.success('Email already verified!', { icon: '🎉' })
        nav('/dashboard')
        return
      }
      
      // Send institute verification email
      try {
        const actionCodeSettings = {
          url: `${window.location.origin}/verify-pending`,
          handleCodeInApp: true
        }
        await sendEmailVerification(u, actionCodeSettings)
        toast.success('Account created! Please check your email for the verification link.', { icon: '📧' })
        nav('/verify-pending')
      } catch (verr) {
        console.error('Verification email error:', verr)
        toast.error('Account created, but verification email failed to send. Please verify from dashboard.')
        nav('/verify-pending')
      }
    } catch (err) {
      console.error('Signup error:', err)
      let msg = err.message || 'Failed to create account.'
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please log in instead.'
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.'
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address format.'
      }
      toast.error(msg)
    } finally {
      setLd(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700/80 p-8 shadow-xl">
        
        {/* Back to Login Link at Top */}
        <div className="mb-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Login</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MANIT Mart
            </span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
            Create an Account
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Join the trusted marketplace for MANIT students
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={sub} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={nm}
              onChange={(e) => setNm(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
              required
            />
          </div>

          {/* College Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              College Email (@stu.manit.ac.in)
            </label>
            <input
              type="email"
              value={em}
              onChange={(e) => setEm(e.target.value)}
              placeholder="e.g. 211112345@stu.manit.ac.in"
              className="input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Must be your official college institute email.
            </p>
          </div>

          {/* Hostel / Residence */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Hostel / Residence
            </label>
            <input
              type="text"
              value={ht}
              onChange={(e) => setHt(e.target.value)}
              placeholder="e.g. Hostel 10, Hostel 7, Day Scholar"
              className="input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 rounded-xl text-sm"
              required
            />
          </div>

          {/* Password with Eye Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={ld}
            className="btn btn-primary w-full text-white rounded-xl shadow-md font-bold text-sm mt-3"
          >
            {ld ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>Creating Account...</span>
              </>
            ) : (
              'Sign Up'
            )}
          </button>

          {/* Back to Login Button */}
          <Link
            to="/login"
            className="btn btn-outline w-full rounded-xl text-sm font-semibold dark:border-slate-600 dark:text-gray-200"
          >
            Back to Login
          </Link>

          {/* Footer Link */}
          <div className="text-center pt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>Already have an account? </span>
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
