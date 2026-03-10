import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Login() {
  const [em, setEm] = useState('')
  const [pw, setPw] = useState('')
  const [ld, setLd] = useState(false)
  const nav = useNavigate()

  const sub = async (e) => {
    e.preventDefault()
    setLd(true)
    try {
      await signInWithEmailAndPassword(auth, em, pw)
      toast.success('Logged in')
      nav('/dashboard')
    } catch (err) {
      toast.error(err.message)
    }
    setLd(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">Login</h2>
        <form onSubmit={sub} className="space-y-5">
          <div>
            <input
              type="email"
              value={em}
              onChange={(e) => setEm(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={ld}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
          >
            {ld ? 'Signing in...' : 'Login'}
          </button>
          <div className="text-center">
            <span className="text-gray-600">Not registered? </span>
            <Link to="/signup" className="text-blue-600 hover:underline">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
