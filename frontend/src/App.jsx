//daisy ui for predesign 
//freepik for images
//react slick slider for slider
import React from "react"
import Home from "./Home/Home"
import Courses from "./Courses/courses"
import Buy from "./Buy/buy"
import Sell from "./Sell/sell"
import Profile from "./components/Profile"
import Signup from "./components/Signup"
import { Toaster } from 'react-hot-toast';

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Contact from "./components/Contact"
import { useAuth } from "./context/AuthProvider";

export default function App() {

  const [authUser, setAuthUser]= useAuth()
  console.log(authUser)
  
  const router = createBrowserRouter([
    {
      path:"/",
      element: <> <Home/> </>
    },
    {
      path:"/buy",
      element: <> {authUser? <Buy/> : <Navigate to="/signup" />} </>
    },
    {
      path:"/sell",
      element: <> {authUser? <Sell/> : <Navigate to="/signup" />} </>
    },
    {
      path:"/profile",
      element: <> {authUser? <Profile/> : <Navigate to="/signup" />} </>
    },
    {
      path:"/signup",
      element: <> <Signup /> </>
    },
    {
      path:"/contact",
      element: <> <Contact /> </>
    }
  ])

  return (
    <>
    <div className='dark:bg-slate-900 dark:text-white'>
      <RouterProvider router={router} />
      <Toaster />
    </div>
    </>
  )
}