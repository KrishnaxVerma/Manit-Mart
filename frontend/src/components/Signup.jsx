import React from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Login from './Login'
import { useForm } from "react-hook-form"
import axios from "axios"
import toast from 'react-hot-toast'

function Signup() {
    const location= useLocation()
    const navigate= useNavigate()
    const from= location.state?.from?.pathname || "/"
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()
    const onSubmit = async(data) => {
        const userInfo={
            fullname: data.fullname,
            phoneNumber: data.phoneNumber,
            password: data.password
        }
        await axios.post(import.meta.env.VITE_HOSTURL+"user/signup", userInfo)
        .then((res)=>{console.log('Signup component rendered')
console.log('Location:', location)
console.log('Navigate:', navigate)
console.log('From:', from)
            console.log(res.data)
            if(res.data){
                toast.success("Signup Successfully");
                navigate(from, {replace: true})
            }
            localStorage.setItem("Users", JSON.stringify(res.data.user))
        }).catch((err)=>{
            if(err.response){
                console.log(err.message)
                toast.error("Error: "+ err.response.data.message);
            }
        })
    }

    return (
        <div className='flex h-screen items-center justify-center'>
            <div className="w-[600px]">
                <div className="modal-box dark:bg-slate-900 dark:text-white">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* if there is a button in form, it will close the modal */}
                        <Link to="/" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</Link>

                        <h3 className="font-bold text-lg">Signup</h3>
                        {/* Name */}
                        <div className='mt-4 space-y-2'>
                            <span>Name</span>
                            <br />
                            <input 
                            type="text" 
                            placeholder='Enter your full name' 
                            className='w-80 px-3 py-1 border rounded-md outline-none dark:bg-slate-900 dark:text-white' 
                            {...register("fullname", { required: true })}
                            />
                            <br />
                            {errors.fullname && <span className='text-sm text-red-600'>This field is required</span>}
                        </div>
                        {/* Phone Number */}
                        <div className='mt-4 space-y-2'>
                            <span>Phone Number</span>
                            <br />
                            <input 
                            type="string" 
                            placeholder='Enter your Phone Number' 
                            className='w-80 px-3 py-1 border rounded-md outline-none dark:bg-slate-900 dark:text-white' 
                            {...register("phoneNumber", {
                                required: "Phone number is required",
                                pattern: { value: /^[0-9]{10}$/, message: "Invalid phone number" }
                              })}
                            />
                            <br />
                            {errors.phoneNumber && <span className='text-sm text-red-600'>{errors.phoneNumber.message}</span>}
                        </div>
                        {/* Password */}
                        <div className='mt-4 space-y-2'>
                            <span>Password</span>
                            <br />
                            <input 
                            type="password" 
                            placeholder='Enter your Phone Number' 
                            className='w-80 px-3 py-1 border rounded-md outline-none dark:bg-slate-900 dark:text-white' 
                            {...register("password", { required: true })}
                            />
                            <br />
                            {errors.password && <span className='text-sm text-red-600'>This field is required</span>}
                        </div>
                        {/* Button */}
                        <div className='flex justify-around mt-4 '>
                            <button className='bg-pink-500 text-white rounded-md px-3 py-1 hover:bg-pink-700 duration-200'>Signup</button>
                            <span className='text-xl'>
                                Have an account? <button className='underline text-blue-500 cursor-pointer' onClick={() => document.getElementById('my_modal_3').showModal()}>Login</button>
                            </span>
                        </div>
                    </form>
                    <Login />
                </div>
            </div>
        </div >
    )
}

export default Signup
