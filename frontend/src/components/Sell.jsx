import React, { useEffect, useState } from 'react'
import Card from "../components/Card"
import { useForm } from "react-hook-form"
import { Link, Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from "axios"

function Sell() {
    const [product, setProduct] = useState([])
    useEffect(()=>{
        const getProduct= async()=>{
            try {
                const user = JSON.parse(localStorage.getItem("Users"));
                if (!user?.phoneNumber) {
                    console.error("User not found in localStorage");
                    return;
                }
        
                const { data } = await axios.post("http://localhost:4001/sell/myproduct", { user });
                // console.log("Products:", data);
                setProduct(data);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        }
        getProduct()
    },[])

    const navigate= useNavigate()
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm()
    const onSubmit = async (data) => {
        const user=JSON.parse(localStorage.getItem("Users"));
        data={...data, phoneNumber: user.phoneNumber}
        // console.log(data);

        try{
            const res= await axios.post("http://localhost:4001/sell/addproduct", data);
            toast.success("Product Added Successfully");                
        } catch (error) {
            console.error("Error listing product:", error);
            toast.error("Failed to add product");
        }

    }

  return (
    <>
        <div className='max-w-screen-2xl container mx-auto md:px-20 px-4'>
            <div className='pt-28 text-center'>
                <h1 className='text-2xl font-semibold md:text-4xl'>
                      Turn Your Unused Items into 
                    <span className='text-pink-500'> Cash! :)</span>
                </h1>
                <p className='mt-12'>
                Have books, gadgets, or other essentials you no longer need? List them on MANIT Mart and connect with buyers within the college. Sell effortlessly and give your items a new home while earning some extra money!
                </p>
                <Link to="/">
                    <button className="btn btn-secondary text-white mt-6">Back</button>
                </Link>
                <div>
                    <div>
                        <h1 className='mt-8 text-xl font-semibold md:text-4xl'>Your Listed Items</h1>
                        <div className='mt-12 grid grid-cols-1 md:grid-cols-4'>
                            {/* {
                                product.map((item)=>{
                                    return <Card item={item} key={item.id} />
                                })
                            } */}
                            {product.map((item, index) => (
                                <Card item={item} key={index} />
                            ))}
                        </div>
                        
                        <h1 className='mt-8 text-xl font-semibold md:text-4xl'>Add an Item</h1>

                        <div className="modal-box dark:text-white dark:bg-slate-900 border-[2px] dark:border-[2px] border-black dark:border-white">
                            <form onSubmit={handleSubmit(onSubmit)} method="dialog" className='text-left'>

                            {/* Name */}
                            <div className='mt-4 space-y-2'>
                                <span>Product Name</span>
                                <br />
                                <input 
                                type="text" 
                                placeholder='Enter your product name' 
                                className='w-[80%] px-3 py-1 border rounded-md outline-none text-black' 
                                {...register("name", { required: true })}
                                />
                                <br />
                                {errors.name && <span className='text-sm text-red-600'>This field is required</span>}
                            </div>
                            {/* Price */}
                            <div className='mt-4 space-y-2'>
                                <span>Price (in ₹)</span>
                                <br />
                                <input 
                                type="Number" 
                                placeholder='Enter price' 
                                className='w-[80%] px-3 py-1 border rounded-md outline-none text-black' 
                                {...register("price", { required: true })}
                                />
                                <br />
                                {errors.price && <span className='text-sm text-red-600'>This field is required</span>}
                            </div>
                            {/* Category */}
                            <div className='mt-4 space-y-2'>
                                <span>Select Category</span>
                                <br />
                                <select 
                                {...register("category", { required: true })} 
                                name="category" className="w-[80%] px-3 py-1 border rounded-md outline-none text-black">
                                    <option value="Accessory">Accessory</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Book">Book</option>
                                    <option value="Stationary">Stationary</option>
                                </select>
                                <br />
                                {errors.category && <span className='text-sm text-red-600'>This field is required</span>}
                            </div>
                            {/* ImageURL */}
                            <div className='mt-4 space-y-2'>
                                <span>Drive Link of Product Image</span>
                                <br />
                                <input 
                                type="url" 
                                placeholder='Enter Image Link' 
                                className='w-[80%] px-3 py-1 border rounded-md outline-none text-black' 
                                {...register("imageURL", { required: true })}
                                />
                                <br />
                                {errors.imageURL && <span className='text-sm text-red-600'>This field is required</span>}
                            </div>
                            {/* Description */}
                            {/* <div className='mt-4 space-y-2'>
                                <span>Message</span>
                                <br />
                                <textarea
                                placeholder='Type your message' 
                                className='w-[80%] h-40 px-3 py-1 border rounded-md outline-none' 
                                {...register("message", { required: true })}
                                />
                                <br />
                                {errors.message && <span className='text-sm text-red-600'>This field is required</span>}
                            </div> */}
                            {/* Button */}
                            <div className='mt-5'>
                                <button className='bg-blue-500 text-white rounded-md px-3 py-1 hover:bg-blue-700 duration-200'>Submit</button>
                            </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </>
  )
}

export default Sell
