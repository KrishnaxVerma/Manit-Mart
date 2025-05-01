import React, { useState } from 'react'
import Navbar from './Navbar'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form"
import toast from 'react-hot-toast'
import axios from 'axios'

function Profile() {
    const User = JSON.parse(localStorage.getItem("Users"));
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({})

    // State to track which fields are being edited
    const [editingField, setEditingField] = useState({
        fullname: false,
        phoneNumber: false,
        password: false
    });

    const toggleEdit = (field) => {
        setEditingField({
            ...editingField,
            [field]: !editingField[field]
        });
    };

    const onSubmit = async (data) => {
        // Only include fields that were being edited
        const userInfo = { _id: User._id };
        
        if (editingField.fullname && data.fullname) {
            userInfo.fullname = data.fullname;
        }
        
        if (editingField.phoneNumber && data.phoneNumber) {
            userInfo.phoneNumber = data.phoneNumber;
        }
        
        if (editingField.password && data.password) {
            userInfo.password = data.password;
        }

        try {
            await axios.patch(import.meta.env.VITE_HOSTURL + "user/updateInfo", userInfo)
                .then((res) => {
                    if (res.data) {
                        toast.success("Profile Updated Successfully");
                        setTimeout(() => {
                            window.location.reload()
                            localStorage.setItem("Users", JSON.stringify(res.data.user))
                        }, 1000);
                    }
                }).catch((err) => {
                    if (err.response) {
                        console.log(err.message)
                        toast.error("Error: " + err.response.data.message);
                    }
                })
        }
        catch (err) {
            toast.error("Failed to Update Profile");
        }
        
        // Reset editing state
        setEditingField({
            fullname: false,
            phoneNumber: false,
            password: false
        });
    }

    return (
        <>
            <Navbar />
            <div className='flex h-screen items-center justify-center dark:text-white dark:bg-slate-900'>
                <div className="w-[600px] ">
                    <div className="modal-box dark:text-white dark:bg-slate-900 dark:border-[2px] dark:border-white">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Link to="/" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</Link>

                            <h1 className="font-semibold text-4xl">Edit Profile</h1>
                            
                            {/* Name */}
                            <div className='mt-4 space-y-2'>
                                <div className="flex justify-between items-center">
                                    <span>Name</span>
                                    <button 
                                        type="button" 
                                        className="text-blue-500 hover:text-blue-700"
                                        onClick={() => toggleEdit('fullname')}
                                    >
                                        {editingField.fullname ? 'Cancel' : 'Edit'}
                                    </button>
                                </div>
                                {/* <br /> */}
                                {editingField.fullname ? (
                                    <>
                                        <input
                                            type="text"
                                            placeholder={User.fullname}
                                            className='w-80 px-3 py-1 border rounded-md outline-none text-black'
                                            {...register("fullname")}
                                        />
                                        <br />
                                        {errors.fullname && <span className='text-sm text-red-600'>This field is required</span>}
                                    </>
                                ) : (
                                    <div className="px-3 py-1 border rounded-md bg-gray-100 text-gray-700 w-80">
                                        {User.fullname}
                                    </div>
                                )}
                            </div>
                            
                            {/* Phone Number */}
                            <div className='mt-4 space-y-2'>
                                <div className="flex justify-between items-center">
                                    <span>Phone Number</span>
                                    <button 
                                        type="button" 
                                        className="text-blue-500 hover:text-blue-700"
                                        onClick={() => toggleEdit('phoneNumber')}
                                    >
                                        {editingField.phoneNumber ? 'Cancel' : 'Edit'}
                                    </button>
                                </div>
                                {/* <br /> */}
                                {editingField.phoneNumber ? (
                                    <>
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
                                    </>
                                ) : (
                                    <div className="px-3 py-1 border rounded-md bg-gray-100 text-gray-700 w-80">
                                        {User.phoneNumber}
                                    </div>
                                )}
                            </div>
                            
                            {/* Password */}
                            <div className='mt-4 space-y-2'>
                                <div className="flex justify-between items-center">
                                    <span>Password</span>
                                    <button 
                                        type="button" 
                                        className="text-blue-500 hover:text-blue-700"
                                        onClick={() => toggleEdit('password')}
                                    >
                                        {editingField.password ? 'Cancel' : 'Edit'}
                                    </button>
                                </div>
                                {/* <br /> */}
                                {editingField.password ? (
                                    <>
                                        <input
                                            type="password"
                                            placeholder="Enter new Password"
                                            className='w-80 px-3 py-1 border rounded-md outline-none text-black'
                                            {...register("password")}
                                        />
                                        <br />
                                        {errors.password && <span className='text-sm text-red-600'>This field is required</span>}
                                    </>
                                ) : (
                                    <div className="px-3 py-1 border rounded-md bg-gray-100 text-gray-700 w-80">
                                        ••••••••
                                    </div>
                                )}
                            </div>
                            
                            {/* Button - Only show if at least one field is being edited */}
                            {(editingField.fullname || editingField.phoneNumber || editingField.password) && (
                                <div className='mt-5'>
                                    <button className='bg-blue-500 text-white rounded-md px-3 py-1 hover:bg-blue-700 duration-200'>
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Profile