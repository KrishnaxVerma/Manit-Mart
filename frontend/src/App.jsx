import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './Home/Home'
import Buy from './components/Buy'
import Sell from './components/Sell'
import Profile from './components/Profile'
import Signup from './components/Signup'
import Login from './components/Login'
import VerificationPending from './components/VerificationPending'
import Contact from './components/Contact'

export default function App() {
  const [usr, setUsr] = useState(null)
  const [ld, setLd] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUsr(u)
      setLd(false)
    })
    return unsub
  }, [])

  if (ld) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  const router = createBrowserRouter([
    { path: "/", element: <Home /> },
    { path: "/login", element: usr ? (usr.emailVerified ? <Navigate to="/dashboard" /> : <Navigate to="/verify-pending" />) : <Login /> },
    { path: "/signup", element: usr ? (usr.emailVerified ? <Navigate to="/dashboard" /> : <Navigate to="/verify-pending" />) : <Signup /> },
    { path: "/verify-pending", element: usr ? (usr.emailVerified ? <Navigate to="/dashboard" /> : <VerificationPending />) : <Navigate to="/login" /> },
    { path: "/buy", element: usr && usr.emailVerified ? <Buy /> : <Navigate to="/login" /> },
    { path: "/sell", element: usr && usr.emailVerified ? <Sell /> : <Navigate to="/login" /> },
    { path: "/profile", element: usr && usr.emailVerified ? <Profile /> : <Navigate to="/login" /> },
    { path: "/contact", element: <Contact /> },
    { path: "/dashboard", element: usr && usr.emailVerified ? <Home /> : <Navigate to="/login" /> }
  ])

  return (
    <div className='dark:bg-slate-900 dark:text-white'>
      <RouterProvider router={router} />
      <Toaster />
    </div>
  )
}