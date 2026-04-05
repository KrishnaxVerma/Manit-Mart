import { useState } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, auth } from '../firebase'
import toast from 'react-hot-toast'

export default function ProductCard({ product, onInterested }) {
  const [ld, setLd] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)
  const [showAllImages, setShowAllImages] = useState(false)
  const u = auth.currentUser

  const handleInterested = async () => {
    if (!u) return
    setLd(true)
    try {
      const productRef = doc(db, 'products', product.id)
      
      if (product.interested?.includes(u?.uid)) {
        await updateDoc(productRef, {
          interested: arrayRemove(u.uid)
        })
        toast.success('Removed from interested')
      } else {
        await updateDoc(productRef, {
          interested: arrayUnion(u.uid)
        })
        toast.success('Marked as interested')
      }
      
      onInterested(product.id)
    } catch (err) {
      toast.error('Failed to update')
    }
    setLd(false)
  }

  const isInterested = product.interested?.includes(u?.uid)
  const images = product.imageUrls || []

  const nextImg = () => {
    setCurrentImg((prev) => (prev + 1) % images.length)
  }

  const prevImg = () => {
    setCurrentImg((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition cursor-pointer">
      <div 
        className="flex gap-4"
        onClick={() => setShowAllImages(true)}
      >
        <div className="relative w-24 h-32 bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center overflow-hidden">
          {images.length > 0 ? (
            <>
              <img 
                src={images[currentImg]} 
                alt={product.title}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="absolute inset-0 bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center" style={{ display: 'none' }}>
                <span className="text-gray-400 dark:text-gray-500 text-xs">Failed</span>
              </div>
              {images.length > 1 && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentImg(index)
                      }}
                      className={`w-2 h-2 rounded-full transition ${
                        index === currentImg ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              )}
              {images.length > 1 && (
                <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">
                  +{images.length}
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-xs">No Images</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{product.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product.category}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{product.description?.substring(0, 50)}...</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{product.price}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{product.condition}</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">{product.sellerName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleInterested()
              }}
              disabled={ld || !u}
              className={`px-3 py-1 rounded text-sm transition ${
                isInterested 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-pink-500 text-white hover:bg-pink-600 disabled:bg-gray-300 dark:disabled:bg-gray-600'
              }`}
            >
              {ld ? '...' : isInterested ? 'Undo Interested' : 'Interested'}
            </button>
          </div>
        </div>
      </div>

      {showAllImages && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl max-h-screen overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{product.title}</h3>
                <button
                  onClick={() => setShowAllImages(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Product Images</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img}
                          alt={`${product.title} ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}/{images.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Product Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{product.category}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Condition:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{product.condition}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Price:</span>
                      <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">₹{product.price}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Seller:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{product.sellerName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Description:</span>
                      <p className="text-gray-700 dark:text-gray-300">{product.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Interested Users:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{product.interested?.length || 0} people interested</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleInterested}
                  disabled={ld || !u}
                  className={`flex-1 px-4 py-2 rounded font-medium transition ${
                    isInterested 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-pink-500 text-white hover:bg-pink-600 disabled:bg-gray-300 dark:disabled:bg-gray-600'
                  }`}
                >
                  {ld ? '...' : isInterested ? 'Undo Interested' : 'Mark as Interested'}
                </button>
                <button
                  onClick={() => setShowAllImages(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
