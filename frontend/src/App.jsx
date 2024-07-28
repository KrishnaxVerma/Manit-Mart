//daisy ui for predesign 
//freepik for images
//react slick slider for slider
import React from "react"
import Home from "./Home/Home"
import Courses from "./Courses/courses"
import Signup from "./components/Signup"

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Contact from "./components/Contact"

export default function App() {
  
  const router = createBrowserRouter([
    {
      path:"/",
      element: <> <Home/> </>
    },
    {
      path:"/course",
      element: <> <Courses/> </>
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
    </div>
    </>
  )
}