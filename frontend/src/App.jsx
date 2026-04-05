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
import Layout from './components/Layout'

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

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light"
    const element = document.documentElement
    if (theme === "dark") {
      element.classList.add("dark")
      document.body.classList.add("dark")
    } else {
      element.classList.remove("dark")
      document.body.classList.remove("dark")
    }
  }, [])

  if (ld) return <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900 dark:text-white">Loading...</div>

  const router = createBrowserRouter([
    { path: "/", element: <Home /> },
    { path: "/login", element: usr ? (usr.emailVerified ? <Navigate to="/dashboard" /> : <Navigate to="/verify-pending" />) : <Login /> },
    { path: "/signup", element: usr ? (usr.emailVerified ? <Navigate to="/dashboard" /> : <Navigate to="/verify-pending" />) : <Signup /> },
    { path: "/verify-pending", element: usr ? (usr.emailVerified ? <Navigate to="/dashboard" /> : <VerificationPending />) : <Navigate to="/login" /> },
    { path: "/buy", element: usr && usr.emailVerified ? <Layout><Buy /></Layout> : <Navigate to="/login" /> },
    { path: "/sell", element: usr && usr.emailVerified ? <Layout><Sell /></Layout> : <Navigate to="/login" /> },
    { path: "/profile", element: usr && usr.emailVerified ? <Layout><Profile /></Layout> : <Navigate to="/login" /> },
    { path: "/contact", element: <Layout><Contact /></Layout> },
    { path: "/dashboard", element: usr && usr.emailVerified ? <Home /> : <Navigate to="/login" /> }
  ])

  return (
    <div className='min-h-screen bg-white dark:bg-slate-900 dark:text-white transition-colors duration-300'>
      <RouterProvider router={router} />
      <Toaster 
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-white',
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
          },
        }}
      />
    </div>
  )
}