import { useState, useEffect } from 'react'
import { reload, sendEmailVerification } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function VerificationPending() {
  const [ld, setLd] = useState(false)
  const [chkLd, setChkLd] = useState(false)
  const nav = useNavigate()

  const resendV = async () => {
    const u = auth.currentUser
    if (!u) return
    
    
    setLd(true)
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: true
      }
      await sendEmailVerification(u, actionCodeSettings)
      toast.success('Verification email sent')
    } catch (err) {
      toast.error(err.message)
    }
    setLd(false)
  }

  const chkV = async () => {
    const u = auth.currentUser
    if (!u) return
    
    setChkLd(true)
    try {
      await reload(u)
      await u.getIdToken(true)
      if (u.emailVerified) {
        const pendingProfile = localStorage.getItem(`pendingProfile:${u.uid}`)
        if (pendingProfile) {
          await setDoc(doc(db, 'users', u.uid), {
            ...JSON.parse(pendingProfile),
            createdAt: new Date()
          })
          localStorage.removeItem(`pendingProfile:${u.uid}`)
        }
        toast.success('Email verified!')
        nav('/dashboard')
      } else {
        toast.error('Email not verified yet')
      }
    } catch (err) {
      console.error('Check error:', err.message)
      toast.error(err.message)
    }
    setChkLd(false)
  }

  useEffect(() => {
    if (!auth.currentUser) {
      nav('/login')
    }
  }, [nav])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">Verify Email</h2>
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Check your email for verification link
          </p>
          <p className="text-sm text-gray-500">
            {auth.currentUser?.email}
          </p>
          <div className="space-y-3 pt-4">
            <button
              onClick={resendV}
              disabled={ld}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {ld ? 'Sending...' : 'Resend Verification Email'}
            </button>
            <button
              onClick={chkV}
              disabled={chkLd}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition"
            >
              {chkLd ? 'Checking...' : 'I Verified My Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
