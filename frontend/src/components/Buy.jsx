import React, { useEffect, useState } from 'react'
import Card from "../components/Card"
import {Link} from "react-router-dom"

import axios from "axios"

function Product() {
    const [product, setProduct] = useState([])
    useEffect(()=>{
        const getProduct= async()=>{
            try {
                const res = await axios.get("http://localhost:4001/buy")
                console.log(res.data)
                setProduct(res.data)
            } catch (error) {
                console.log(error)
            }
        }
        getProduct()
    },[])
  return (
    <>
        <div className='max-w-screen-2xl container mx-auto md:px-20 px-4'>
            <div className='pt-28 text-center'>
                <h1 className='text-2xl font-semibold md:text-4xl'>
                    We are delighted to have you 
                    <span className='text-pink-500'> Here! :)</span>
                </h1>
                <p className='mt-12'>
                Explore a wide range of products listed by fellow MANIT students. Buy books, gadgets, accessories, and more at affordable prices. Find what you need and make hassle-free purchases within the college community!
                </p>
                <Link to="/">
                    <button className="btn btn-secondary text-white mt-6">Back</button>
                </Link>
                <div>
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
                </div>
            </div>
        </div>

    </>
  )
}

export default Product
