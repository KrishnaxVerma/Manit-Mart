import React from 'react'
import Navbar from './Navbar'
import Login from './Login'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form"

function Contact() {
    const navigate= useNavigate()
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()
    const onSubmit = (data) => {
        console.log(data)
        navigate("/")
    }

  return (
    <>
    <Navbar />
    <div className='flex h-screen items-center justify-center dark:text-white dark:bg-slate-900'>
            <div className="w-[600px] ">
                <div className="modal-box dark:text-white dark:bg-slate-900 dark:border-[2px] dark:border-white">
                    <form onSubmit={handleSubmit(onSubmit)} method="dialog">
                        {/* if there is a button in form, it will close the modal */}
                        <Link to="/" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</Link>

                        <h1 className="font-semibold text-4xl">Contact Us</h1>
                        {/* Name */}
                        <div className='mt-4 space-y-2'>
                            <span>Name</span>
                            <br />
                            <input 
                            type="text" 
                            placeholder='Enter your full name' 
                            className='w-80 px-3 py-1 border rounded-md outline-none' 
                            {...register("name", { required: true })}
                            />
                            <br />
                            {errors.name && <span className='text-sm text-red-600'>This field is required</span>}
                        </div>
                        {/* Email */}
                        <div className='mt-4 space-y-2'>
                            <span>Email</span>
                            <br />
                            <input 
                            type="email" 
                            placeholder='Enter your email' 
                            className='w-80 px-3 py-1 border rounded-md outline-none' 
                            {...register("email", { required: true })}
                            />
                            <br />
                            {errors.email && <span className='text-sm text-red-600'>This field is required</span>}
                        </div>
                        {/* Message */}
                        <div className='mt-4 space-y-2'>
                            <span>Message</span>
                            <br />
                            <textarea
                            placeholder='Type your message' 
                            className='w-96 h-40 px-3 py-1 border rounded-md outline-none' 
                            {...register("message", { required: true })}
                            />
                            <br />
                            {errors.message && <span className='text-sm text-red-600'>This field is required</span>}
                        </div>
                        {/* Button */}
                        <div className='mt-5'>
                            <button className='bg-blue-500 text-white rounded-md px-3 py-1 hover:bg-blue-700 duration-200'>Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div >
    </>
  )
}

export default Contact
