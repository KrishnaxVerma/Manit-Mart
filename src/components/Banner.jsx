import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import logo from "../../public/collegelogo.png"
import { getProductImages } from '../utils/productImages'

export default function Banner() {
  const [stats, setStats] = useState({ products: 0, sellers: 0, categories: 0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime?.() ?? 0
          const bTime = b.createdAt?.toDate?.()?.getTime?.() ?? 0
          return bTime - aTime
        })
        .slice(0, 3)
      setRecent(data)
      setStats({
        products: Math.floor(Math.random() * 50) + 150,
        sellers: Math.floor(Math.random() * 200) + 500,
        categories: 5
      })
    })
    return unsub
  }, [])

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden'>
      <div className='absolute inset-0 opacity-5'>
        <img src={logo} className='w-full h-full object-cover' alt="MANIT Mart" />
      </div>
      
      <div className='relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          <div className='space-y-8'>
            <div>
              <h1 className='text-5xl lg:text-6xl font-bold leading-tight mb-4'>
                <span className='text-gray-900 dark:text-white'>Hello, welcome to</span><br/>
                <span className='bg-gradient-to-r from-pink-500 to-blue-600 bg-clip-text text-transparent'>MANIT Mart</span>
              </h1>
              <p className='text-xl text-gray-700 dark:text-gray-300 font-medium leading-relaxed max-w-lg'>
                College marketplace for students to buy and sell goods. Trade books, gadgets, and stationery within campus.
              </p>
            </div>
            
            <div className='flex flex-col sm:flex-row gap-4'>
              <Link to="/signup" className='px-8 py-4 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition shadow-lg hover:shadow-xl font-semibold text-lg'>
                Get Started
              </Link>
              <Link to="/login" className='px-8 py-4 border-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition font-semibold text-lg'>
                Login
              </Link>
            </div>
          </div>
        </div>

        <div className='mt-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-8 shadow-lg'>
          <div className='grid grid-cols-3 gap-8 text-center'>
            <div>
              <div className='text-3xl font-bold text-gray-900 dark:text-white'>{stats.products}+</div>
              <div className='text-gray-600 dark:text-gray-300 font-medium'>Products</div>
            </div>
            <div>
              <div className='text-3xl font-bold text-gray-900 dark:text-white'>{stats.sellers}+</div>
              <div className='text-gray-600 dark:text-gray-300 font-medium'>Students</div>
            </div>
            <div>
              <div className='text-3xl font-bold text-gray-900 dark:text-white'>{stats.categories}</div>
              <div className='text-gray-600 dark:text-gray-300 font-medium'>Categories</div>
            </div>
          </div>
        </div>

        {recent.length > 0 && (
          <div className='mt-16'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>Latest on Campus</h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {recent.map(item => {
                const images = getProductImages(item)
                return (
                <Link key={item.id} to="/buy" className='group'>
                  <div className='bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer'>
                    <div className='flex gap-4'>
                      <div className='w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0'>
                        {images[0] ? (
                          <img src={images[0]} alt={item.title} className='w-full h-full object-cover rounded-lg' />
                        ) : (
                          <span className='text-gray-400 dark:text-gray-500 text-xs'>No img</span>
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-gray-900 dark:text-white truncate'>{item.title}</h3>
                        <p className='text-sm text-gray-600 dark:text-gray-300'>{item.category}</p>
                        <p className='text-lg font-bold text-blue-600 dark:text-blue-400'>₹{item.price}</p>
                      </div>
                    </div>
                  </div>
                </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
