import React from 'react';

function Card({item, onDelete, showDeleteButton = false}) {
    return (
        <div className='mt-4 my-3 p-3'>
            <div className="card bg-base-100 shadow-xl hover:scale-105 duration-200 dark:bg-slate-900 dark:text-white dark:border h-96 w-full">
                <figure className="h-48 overflow-hidden">
                    <img
                        src={item.imageURL}
                        alt={item.name}
                        className="w-full h-full object-cover" 
                    />
                </figure>
                <div className="card-body">
                    <h2 className="card-title">
                        {item.name}
                        <div className="badge badge-secondary">{item.category}</div>
                    </h2>
                    <div className="card-actions justify-between mt-auto">
                        <div className="badge badge-outline">₹{item.price}</div>
                        {showDeleteButton ? (
                            <div 
                                className="cursor-pointer px-2 py-1 rounded-full border-[2px] border-red-500 hover:bg-red-500 hover:text-white p-2 transition-colors"
                                onClick={onDelete}
                            >
                                Delete
                            </div>
                        ) : (
                            <div className="cursor-pointer px-2 py-1 rounded-full border-[2px] hover:bg-pink-500 hover:text-white p-2 transition-colors">
                                <a href={`https://wa.me/${item.phoneNumber}`} target="_blank" rel="noopener noreferrer">Contact</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Card;