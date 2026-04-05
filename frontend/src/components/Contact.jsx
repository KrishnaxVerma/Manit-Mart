import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
        <div className='min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 py-8'>
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-8 shadow-lg relative">
                    <form onSubmit={onSubmit}>
                        {/* Close button */}
                        <Link to="/" className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">✕</Link>
                        
                        <h1 className="font-bold text-3xl text-gray-900 dark:text-white mb-6">Contact Us</h1>
                        
                        {/* Status Message */}
                        {result && (
                            <div className={`mt-4 p-3 rounded ${
                                result === "Form Submitted Successfully" 
                                    ? 'bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400' 
                                    : result === "Sending...." 
                                    ? 'bg-blue-100 border border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400'
                                    : 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400'
                            }`}>
                                {result}
                            </div>
                        )}
                        
                        {/* Name */}
                        <div className='mt-6 space-y-2'>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder='Enter your full name'
                                className='w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                                required
                            />
                        </div>
                        
                        {/* Phone Number */}
                        <div className='mt-6 space-y-2'>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder='Enter your Phone Number'
                                className='w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                                required
                            />
                        </div>
                        
                        {/* Message */}
                        <div className='mt-6 space-y-2'>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                            <textarea
                                name="message"
                                placeholder='Type your message'
                                className='w-full h-32 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none'
                                required
                            />
                        </div>
                        
                        {/* Submit Button */}
                        <div className='mt-8'>
                            <button 
                                type="submit"
                                className='bg-blue-500 hover:bg-blue-600 text-white rounded-md px-6 py-2 duration-200 font-medium'
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Contact