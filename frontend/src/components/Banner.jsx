import React from 'react'
import logo from "../../public/collegelogo.png"
import { Navigate } from 'react-router-dom'

function Banner() {
  return (
    <>
      <div className='max-w-screen-2xl container mx-auto md:px-20 px-4 flex flex-col md:flex-row my-10'>
        <div className='w-full order-2 md:order-1 md:w-1/2 mt-12 md:mt-32'>
          <div className='space-y-12'>
            <h1 className='text-4xl font-bold'>Hello, welcome here to<br/> <span className='text-pink-500'>Buy & Sell!!!</span></h1>
            <p className='text-xl font-semibold'>

MANIT Mart is a college-based platform for MANIT students to buy and sell goods. It connects students for trading items like books, gadgets, and stationery, offering an easy and secure way to exchange necessities within the campus community.
            </p>
            <label className="input input-bordered flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70">
                <path
                  d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                <path
                  d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
              </svg>
              <input type="text" className="grow" placeholder="Enter your Phone Number to login" />
            </label>
          </div>
          <button className="btn btn-secondary mt-6">Get Started</button>
        </div>
        <div className='order-1 w-full md:w-1/2 flex justify-center items-center'>
        <img src={logo} className='w-[30vh] h-[30vh] md:w-[50vh] md:h-[50vh]' alt="" />
        </div>
      </div>
    </>
  )
}

export default Banner
