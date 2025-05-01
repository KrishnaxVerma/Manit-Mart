import React, { useEffect, useState } from 'react';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Slider from "react-slick";
import Card from './Card';

import axios from "axios";

function Freebook() {
    const [book, setBook] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getBook = async () => {
            try {
                const res = await axios.get(import.meta.env.VITE_HOSTURL+"book");
                const data = res.data.filter((data) => data.price === 0);
                setBook(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        getBook();
    }, []);

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 3,
        initialSlide: 0,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    infinite: true,
                    dots: true
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    initialSlide: 2
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    return (
        <div className='max-w-screen-2xl container mx-auto md:px-20 px-4'>
            <div>
                <h1 className='font-semibold text-xl pb-2'>Free Offered Courses</h1>
                <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quam, officiis? Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium, repellat.</p>
            </div>
            <div>
                {loading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p>Error: {error}</p>
                ) : (
                    <Slider {...settings}>
                        {book.map(({ id, ...item }) => (
                            <Card key={id} item={item} />
                        ))}
                    </Slider>
                )}
            </div>
        </div>
    );
}

export default Freebook;
