import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { getOptimizedCloudinaryUrl, getProductImages } from '../utils/productImages'
import { db } from '../firebase'

export default function ProductCard({ product }) {
  const [currentImg, setCurrentImg] = useState(0)
  const [showAllImages, setShowAllImages] = useState(false)
  const [ownerName, setOwnerName] = useState(product.sellerName || 'Unknown seller')
  const [ownerEmail, setOwnerEmail] = useState(product.sellerEmail?.trim() || '')
  const images = getProductImages(product)
  const galleryImages = images.map((image) =>
    getOptimizedCloudinaryUrl(image, 'w_400,c_scale')
  )
  const sellerEmail = ownerEmail
  const subject = encodeURIComponent(`Interested in buying ${product.title} - MANIT Mart`)
  const body = encodeURIComponent(
    `Hi, I saw your listing for '${product.title}' on MANIT Mart and I am interested in buying it. Is it still available?`
  )
  const contactHref = sellerEmail
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(sellerEmail)}&su=${subject}&body=${body}`
    : null

  useEffect(() => {
    let isMounted = true

    setOwnerName(product.sellerName || 'Unknown seller')
    setOwnerEmail(product.sellerEmail?.trim() || '')

    const loadOwnerName = async () => {
      if (!product.sellerId) {
        return
      }

      try {
        const userSnapshot = await getDoc(doc(db, 'users', product.sellerId))

        if (!isMounted || !userSnapshot.exists()) {
          return
        }

        const profileName = userSnapshot.data()?.name?.trim()
        const profileEmail = userSnapshot.data()?.email?.trim()

        if (profileName) {
          setOwnerName(profileName)
        }

        if (profileEmail) {
          setOwnerEmail(profileEmail)
        }
      } catch (error) {
        // Fall back to the stored sellerName when profile lookup fails.
      }
    }

    loadOwnerName()

    return () => {
      isMounted = false
    }
  }, [product.sellerEmail, product.sellerId, product.sellerName])

  const nextImg = () => {
    setCurrentImg((prev) => (prev + 1) % images.length)
  }

  const prevImg = () => {
    setCurrentImg((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="flex h-full cursor-pointer flex-col rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div 
        className="flex h-full gap-4"
        onClick={() => setShowAllImages(true)}
      >
        <div className="relative w-24 h-32 bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center overflow-hidden">
          {images.length > 0 ? (
            <>
              <img 
                src={galleryImages[currentImg]} 
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
        <div className="flex flex-1 flex-col">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{product.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product.category}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{product.description?.substring(0, 50)}...</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{product.price}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{product.condition}</span>
          </div>
          <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">{ownerName}</span>
            {contactHref ? (
              <a
                href={contactHref}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 sm:w-[150px]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                >
                  <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.24-8 5.33-8-5.33V6l8 5.33L20 6v2.24Z" />
                </svg>
                Contact Seller
              </a>
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500">Seller email unavailable</span>
            )}
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
                          src={galleryImages[index]}
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
                      <p className="font-medium text-gray-900 dark:text-white">{ownerName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Description:</span>
                      <p className="text-gray-700 dark:text-gray-300">{product.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Seller Email:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{sellerEmail || 'Not available'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                {contactHref ? (
                  <a
                    href={contactHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-medium text-white transition hover:bg-red-600"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-current"
                    >
                      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.24-8 5.33-8-5.33V6l8 5.33L20 6v2.24Z" />
                    </svg>
                    Contact Seller
                  </a>
                ) : (
                  <div className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-center text-sm text-gray-500 dark:bg-slate-700 dark:text-gray-300">
                    Seller email unavailable
                  </div>
                )}
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
