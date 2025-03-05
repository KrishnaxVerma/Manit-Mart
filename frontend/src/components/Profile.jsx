import React from 'react'
import Navbar from './Navbar'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form"
import toast from 'react-hot-toast'
import axios from 'axios'

function Profile() {
    const User= JSON.parse(localStorage.getItem("Users"));
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({})
    const onSubmit = async (data) => {
        const userInfo = { 
            _id: User._id, 
            fullname: data.fullname, 
            phoneNumber: data.phoneNumber,
            password: data.password
        };
        // console.log("Updated Profile: ", userInfo)
        // console.log(userInfo);
        try{
            await axios.patch("http://localhost:4001/user/updateInfo", userInfo)
            .then((res)=>{
                if(res.data){
                    toast.success("Profile Updated Successfully");                    
                    setTimeout(() => {
                        window.location.reload()
                        localStorage.setItem("Users", JSON.stringify(res.data.user))
                    }, 1000);
                }
            }).catch((err)=>{
                if(err.response){
                    console.log(err.message)
                    toast.error("Error: "+ err.response.data.message);
                    setTimeout(() => {}, 2000);
                }
            })
        }
        catch(err){
            toast.error("Failed to Update Profile");
        }
    }

  return (
    <>
    <Navbar />
    <div className='flex h-screen items-center justify-center dark:text-white dark:bg-slate-900'>
            <div className="w-[600px] ">
                <div className="modal-box dark:text-white dark:bg-slate-900 dark:border-[2px] dark:border-white">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* if there is a button in form, it will close the modal */}
                        <Link to="/" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</Link>

                        <h1 className="font-semibold text-4xl">Edit Profile</h1>
                        {/* Name */}
                        <div className='mt-4 space-y-2'>
                            <span>Name</span>
                            <br />
                            <input 
                            type="text" 
                            placeholder={User.fullname} 
                            className='w-80 px-3 py-1 border rounded-md outline-none text-black' 
                            {...register("fullname")}
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
                            placeholder={User.phoneNumber}
                            className='w-80 px-3 py-1 border rounded-md outline-none text-black' 
                            {...register("phoneNumber", {
                                pattern: { value: /^[0-9]{10}$/, message: "Invalid phone number" }
                              })}
                            />
                            <br />
                            {errors.phoneNumber && <span className='text-sm text-red-600'>{errors.phoneNumber.message}</span>}
                        </div>
                        {/* Name */}
                        <div className='mt-4 space-y-2'>
                            <span>Password</span>
                            <br />
                            <input 
                            type="password" 
                            placeholder="Enter new Password" 
                            className='w-80 px-3 py-1 border rounded-md outline-none text-black' 
                            {...register("password")}
                            />
                            <br />
                            {errors.password && <span className='text-sm text-red-600'>This field is required</span>}
                        </div>
                        {/* Button */}
                        <div className='mt-5'>
                            <button className='bg-blue-500 text-white rounded-md px-3 py-1 hover:bg-blue-700 duration-200'>Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div >
    </>
  )
}

export default Profile
