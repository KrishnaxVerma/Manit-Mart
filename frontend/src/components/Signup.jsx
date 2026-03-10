import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import { auth, db, sendEmailVerification } from '../firebase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Signup() {
  const [nm, setNm] = useState('')
  const [em, setEm] = useState('')
  const [pw, setPw] = useState('')
  const [ht, setHt] = useState('')
  const [ld, setLd] = useState(false)
  const nav = useNavigate()

  const isValidEmail = (email) => email.endsWith('@stu.manit.ac.in')

  const sub = async (e) => {
    e.preventDefault()
    if (!isValidEmail(em)) {
      toast.error('Only @stu.manit.ac.in emails allowed')
      return
    }
    setLd(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, em, pw)
      const u = cred.user
      const uid = u.uid
      
      window.alert(u.email)
      console.log('User email:', u.email)
      console.log('Email verified:', u.emailVerified)
      
      await setDoc(doc(db, 'users', uid), {
        name: nm,
        hostel: ht,
        role: 'student',
        email: em
      })
      
      if (u.emailVerified) {
        toast.success('Email already verified!')
        nav('/dashboard')
        return
      }
      
      try {
        const actionCodeSettings = {
          url: 'http://localhost:5173/verify-pending',
          handleCodeInApp: true
        }
        await sendEmailVerification(u, actionCodeSettings)
        toast.success('Account created. Check your email for verification.')
        nav('/verify-pending')
      } catch (verr) {
        console.error('Verification error code:', verr.code)
        console.error('Verification error:', verr.message)
        window.alert(`Verification failed: ${verr.code} - ${verr.message}`)
        toast.error('Failed to send verification email')
        nav('/verify-pending')
      }
    } catch (err) {
      console.error('Signup error code:', err.code)
      console.error('Signup error:', err.message)
      toast.error(err.message)
    }
    setLd(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">Sign Up</h2>
        <form onSubmit={sub} className="space-y-5">
          <div>
            <input
              type="text"
              value={nm}
              onChange={(e) => setNm(e.target.value)}
              placeholder="Full Name"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>
          <div>
            <input
              type="email"
              value={em}
              onChange={(e) => setEm(e.target.value)}
              placeholder="Email (@stu.manit.ac.in)"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>
          <div>
            <input
              type="text"
              value={ht}
              onChange={(e) => setHt(e.target.value)}
              placeholder="Hostel"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={ld}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
          >
            {ld ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  )
}
