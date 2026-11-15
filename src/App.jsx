import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Home from './Home/Home'
import Buy from './components/Buy'
import Sell from './components/Sell'
import Signup from './components/Signup'
import Login from './components/Login'
import VerificationPending from './components/VerificationPending'
import Contact from './components/Contact'
import Layout from './components/Layout'
import Messages from './components/Messages'
import Account from './components/Account'
import OrdersHistory from './components/OrdersHistory'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import { WishlistProvider } from './context/WishlistContext'

export default function App() {
  const [ld, setLd] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
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
    { path: "/login", element: <Login /> },
    { path: "/reset-password", element: <ResetPassword /> },
    { path: "/signup", element: <Signup /> },
    { path: "/verify-pending", element: <VerificationPending /> },
    { path: "/verify-email", element: <VerificationPending /> },
    { path: "/buy", element: <ProtectedRoute><Layout><Buy /></Layout></ProtectedRoute> },
    { path: "/sell", element: <ProtectedRoute><Layout><Sell /></Layout></ProtectedRoute> },
    { path: "/messages", element: <ProtectedRoute><Layout><Messages /></Layout></ProtectedRoute> },
    { path: "/account", element: <ProtectedRoute><Layout><Account /></Layout></ProtectedRoute> },
    { path: "/orders", element: <ProtectedRoute><Layout><OrdersHistory /></Layout></ProtectedRoute> },
    { path: "/history", element: <ProtectedRoute><Layout><OrdersHistory /></Layout></ProtectedRoute> },
    { path: "/profile", element: <Navigate to="/account" replace /> },
    { path: "/wishlist", element: <ProtectedRoute><Navigate to="/account?tab=saved" replace /></ProtectedRoute> },
    { path: "/saved", element: <ProtectedRoute><Navigate to="/account?tab=saved" replace /></ProtectedRoute> },
    { path: "/contact", element: <Layout><Contact /></Layout> },
    { path: "/dashboard", element: <Home /> }
  ])

  return (
    <WishlistProvider>
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
    </WishlistProvider>
  )
}
