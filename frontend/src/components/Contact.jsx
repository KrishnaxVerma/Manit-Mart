import React from 'react'
import Navbar from './Navbar'
import Login from './Login'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function Contact() {
    const navigate = useNavigate()
    const [result, setResult] = React.useState("")

    const onSubmit = async (event) => {
        event.preventDefault()
        setResult("Sending....")
        const formData = new FormData(event.target)
        const ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY
        formData.append("access_key", ACCESS_KEY)

        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        })

        const data = await response.json()

        if (data.success) {
            setResult("Form Submitted Successfully")
            event.target.reset()
            // Optional: Navigate after successful submission
            setTimeout(() => {
                navigate("/")
            }, 2000)
        } else {
            console.log("Error", data)
            setResult(data.message)
        }
    }

    return (
        <>
            <Navbar />
            <div className='flex h-screen items-center justify-center dark:text-white dark:bg-slate-900'>
                <div className="w-[600px]">
                    <div className="modal-box dark:text-white dark:bg-slate-900 dark:border-[2px] dark:border-white">
                        <form onSubmit={onSubmit}>
                            {/* Close button */}
                            <Link to="/" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</Link>
                            
                            <h1 className="font-semibold text-4xl">Contact Us</h1>
                            
                            {/* Status Message */}
                            {result && (
                                <div className={`mt-4 p-3 rounded ${
                                    result === "Form Submitted Successfully" 
                                        ? 'bg-green-100 border border-green-400 text-green-700' 
                                        : result === "Sending...." 
                                        ? 'bg-blue-100 border border-blue-400 text-blue-700'
                                        : 'bg-red-100 border border-red-400 text-red-700'
                                }`}>
                                    {result}
                                </div>
                            )}
                            
                            {/* Name */}
                            <div className='mt-4 space-y-2'>
                                <span>Name</span>
                                <br />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder='Enter your full name'
                                    className='w-80 px-3 py-1 border rounded-md outline-none dark:bg-slate-800 dark:border-gray-600'
                                    required
                                />
                            </div>
                            
                            {/* Phone Number */}
                            <div className='mt-4 space-y-2'>
                                <span>Phone Number</span>
                                <br />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder='Enter your Phone Number'
                                    className='w-80 px-3 py-1 border rounded-md outline-none dark:bg-slate-800 dark:border-gray-600'
                                    required
                                />
                            </div>
                            
                            {/* Message */}
                            <div className='mt-4 space-y-2'>
                                <span>Message</span>
                                <br />
                                <textarea
                                    name="message"
                                    placeholder='Type your message'
                                    className='w-96 h-40 px-3 py-1 border rounded-md outline-none dark:bg-slate-800 dark:border-gray-600'
                                    required
                                />
                            </div>
                            
                            {/* Submit Button */}
                            <div className='mt-5'>
                                <button 
                                    type="submit"
                                    className='bg-blue-500 text-white rounded-md px-3 py-1 hover:bg-blue-700 duration-200'
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Contact