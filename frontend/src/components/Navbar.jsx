import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import Login from './Login'
import Logout from './Logout'

const navItems = (
  <>
    <li key="home" className="group">
      <Link to='/' className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-pink-500 transition-colors relative">
        Home
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all"></span>
      </Link>
    </li>
    <li key="buy" className="group">
      <Link to='/buy' className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-pink-500 transition-colors relative">
        Buy
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all"></span>
      </Link>
    </li>
    <li key="sell" className="group">
      <Link to='/sell' className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-pink-500 transition-colors relative">
        Sell
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all"></span>
      </Link>
    </li>
    <li key="profile" className="group">
      <Link to='/profile' className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-pink-500 transition-colors relative">
        Profile
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all"></span>
      </Link>
    </li>
    <li key="contact" className="group">
      <Link to='/contact' className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-pink-500 transition-colors relative">
        Contact Us
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-500 group-hover:w-full transition-all"></span>
      </Link>
    </li>
  </>
)

function Navbar() {
  const [usr, setUsr] = useState(null)
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light")
  const [sticky, setSticky] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const element = document.documentElement

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUsr(u))
    return unsub
  }, [])

  useEffect(() => {
    if (theme === "dark") {
      element.classList.add("dark")
      localStorage.setItem("theme", "dark")
      document.body.classList.add("dark")
    } else {
      element.classList.remove("dark")
      localStorage.setItem("theme", "light")
      document.body.classList.remove("dark")
    }
  }, [theme])

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY > 0)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <div className={`z-50 max-w-screen-2xl container mx-auto md:px-20 px-4 dark:bg-slate-900 dark:text-white fixed top-0 left-0 right-0 ${sticky ? "shadow-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm duration-300 transition-all ease-in-out" : "bg-white dark:bg-slate-900"}`}>
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-pink-500 hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </button>
              {mobileMenuOpen && (
                <div className="absolute top-16 left-0 w-full bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-lg">
                  <ul className="py-2">
                    {navItems}
                  </ul>
                </div>
              )}
            </div>
            <a className="text-2xl font-bold cursor-pointer text-gray-900 dark:text-white">MANIT Mart</a>
          </div>
          
          <div className="hidden lg:flex items-center space-x-8">
            <ul className="flex space-x-8">
              {navItems}
            </ul>
          </div>

          <div className="flex items-center space-x-4">
            <label className="swap swap-rotate">
              <input type="checkbox" className="theme-controller" checked={theme === "dark"} onChange={() => setTheme(theme === "light" ? "dark" : "light")} />
              <svg
                className="swap-off h-6 w-6 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24">
                <path
                  d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
              </svg>
              <svg
                className="swap-on h-6 w-6 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24">
                <path
                  d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
              </svg>
            </label>
            {usr ? (
              <Logout />
            ) : (
              <div className="">
                <Link to="/login" className="bg-black dark:bg-white dark:text-black text-white px-4 py-2 rounded hover:bg-slate-800 dark:hover:bg-gray-200 duration-300">Login</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar
