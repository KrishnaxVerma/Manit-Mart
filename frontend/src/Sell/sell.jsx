import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Sell from '../components/Sell'

function sell() {
  return (
    <>
        <Navbar />
        <div className='min-h-screen'>
            <Sell />
        </div>
        <Footer />
    </>
  )
}

export default sell
