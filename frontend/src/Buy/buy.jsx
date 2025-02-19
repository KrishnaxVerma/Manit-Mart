import React from 'react'
import Navbar from '../components/Navbar'
import Buy from '../components/Buy'
import Footer from '../components/Footer'

function courses() {
    return (
        <>
            <Navbar />
            <div className='min-h-screen'>
                <Buy />
            </div>
            <Footer />
        </>
    )
}

export default courses