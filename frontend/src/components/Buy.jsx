import React, { useEffect, useState } from 'react';
import Card from "../components/Card";
import { Link } from "react-router-dom";
import axios from "axios";

function Product() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState("All");
    const categories = ["All", "Books", "Electronics", "Accessories", "Stationary"];

    useEffect(() => {
        const getProducts = async () => {
            try {
                const res = await axios.get(import.meta.env.VITE_HOSTURL + "buy");
                console.log(res.data);
                setProducts(res.data);
                setFilteredProducts(res.data); // Initially show all products
            } catch (error) {
                console.log(error);
            }
        };
        getProducts();
    }, []);

    // Filter products based on selected category
    const filterByCategory = (category) => {
        setActiveCategory(category);
        
        if (category === "All") {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(item => item.category === category);
            setFilteredProducts(filtered);
        }
    };

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
                    
                    {/* Category Filter Buttons */}
                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        {categories.map((category) => (
                            <button 
                                key={category}
                                onClick={() => filterByCategory(category)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    activeCategory === category 
                                        ? 'bg-pink-500 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                    
                    {/* Product Grid */}
                    <div>
                        <div className='mt-12 grid grid-cols-1 md:grid-cols-4 gap-6'>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((item, index) => (
                                    <Card item={item} key={index} />
                                ))
                            ) : (
                                <div className="col-span-4 py-20 text-center text-gray-500">
                                    No products found in this category.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Product;