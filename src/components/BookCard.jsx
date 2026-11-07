import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getOptimizedCloudinaryUrl, getProductImages } from '../utils/productImages'
import { db, auth } from '../firebase'
import ChatModal from './ChatModal'
import WishlistButton from './WishlistButton'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const [currentImg, setCurrentImg] = useState(0)
  const [showAllImages, setShowAllImages] = useState(false)
  const [ownerName, setOwnerName] = useState(product.sellerName || 'Unknown seller')
  const [ownerEmail, setOwnerEmail] = useState(product.sellerEmail?.trim() || '')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [startingChat, setStartingChat] = useState(false)
  const [activeChat, setActiveChat] = useState(null)

  const currentUserId = auth.currentUser?.uid
  const isSeller = Boolean(currentUserId && product.sellerId && currentUserId === product.sellerId)

  const images = getProductImages(product)
  const galleryImages = images.map((image) =>
    getOptimizedCloudinaryUrl(image, 'w_400,c_scale')
  )

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
        // Fall back to stored sellerName if lookup fails
      }
    }

    loadOwnerName()

    return () => {
      isMounted = false
    }
  }, [product.sellerEmail, product.sellerId, product.sellerName])

  /**
   * Idempotently opens or initializes a chat thread for this product and the current buyer.
   */
  const handleOpenChat = async (e) => {
    e?.stopPropagation()

    if (!currentUserId) {
      toast.error('Please log in to chat with the seller')
      return
    }

    if (isSeller) {
      toast('This is your own listing', { icon: 'ℹ️' })
      return
    }

    if (!product.id || !product.sellerId) {
      toast.error('Listing details incomplete')
      return
    }

    setStartingChat(true)
    try {
      const chatId = `${product.id}_${currentUserId}`
      const convRef = doc(db, 'conversations', chatId)
      const convSnap = await getDoc(convRef)

      let conversationData
      if (convSnap.exists()) {
        conversationData = { id: convSnap.id, ...convSnap.data() }
      } else {
        const primaryImage = getProductImages(product)[0] || ''
        conversationData = {
          id: chatId,
          listingId: product.id,
          listingTitle: product.title || 'Product',
          listingPrice: Number(product.price) || 0,
          listingImage: primaryImage,
          sellerId: product.sellerId,
          buyerId: currentUserId,
          participants: [product.sellerId, currentUserId],
          lastMessage: '',
          lastUpdated: serverTimestamp(),
          unreadCount: {
            [product.sellerId]: 0,
            [currentUserId]: 0
          }
        }
        await setDoc(convRef, conversationData, { merge: true })
      }

      setActiveChat(conversationData)
      setIsChatOpen(true)
    } catch (err) {
      console.error('Failed to initiate conversation:', err)
      toast.error('Unable to open chat right now. Please try again.')
    } finally {
      setStartingChat(false)
    }
  }

  return (
    <div className="flex h-full cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-800/90 group">
      <div 
        className="flex h-full gap-4"
        onClick={() => setShowAllImages(true)}
      >
        {/* Thumbnail gallery */}
        <div className="relative w-28 h-36 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 dark:border-slate-700">
          {images.length > 0 ? (
            <>
              <img 
                src={galleryImages[currentImg]} 
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="absolute inset-0 bg-gray-200 dark:bg-slate-700 rounded flex items-center justify-center" style={{ display: 'none' }}>
                <span className="text-gray-400 dark:text-gray-500 text-xs">Failed</span>
              </div>
              {images.length > 1 && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1 z-10">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentImg(index)
                      }}
                      className={`w-2 h-2 rounded-full transition ${
                        index === currentImg ? 'bg-blue-600 scale-125' : 'bg-gray-300/80 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              )}
              {images.length > 1 && (
                <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  +{images.length}
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">No Images</span>
          )}
        </div>

        {/* Card info */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-base">
              {product.title}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                {product.condition}
              </span>
              {!isSeller && (
                <WishlistButton listing={product} />
              )}
            </div>
          </div>

          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
            {product.category}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
            {product.description || 'No description provided.'}
          </p>

          <div className="flex items-baseline justify-between mt-auto pt-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ₹{Number(product.price || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
              👤 {ownerName}
            </span>
          </div>

          {/* Trigger Button: In-App Real-Time Messaging */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between gap-2">
            {isSeller ? (
              <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-default">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Your Listing
              </span>
            ) : (
              <button
                type="button"
                onClick={handleOpenChat}
                disabled={startingChat}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-98 disabled:opacity-75 shadow-sm"
              >
                {startingChat ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                )}
                Chat with Seller
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= DETAILS MODAL ================= */}
      {showAllImages && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAllImages(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-slate-700 pb-3">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{product.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Listed by {ownerName}</p>
                    {!isSeller && (
                      <WishlistButton listing={product} showLabel={true} />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowAllImages(false)}
                  className="btn btn-ghost btn-circle btn-sm text-gray-500 dark:text-gray-400 text-xl"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Product Images</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((img, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                        <img
                          src={galleryImages[index]}
                          alt={`${product.title} ${index + 1}`}
                          className="w-full h-36 object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                          {index + 1}/{images.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Listing Details</h4>
                  <div className="space-y-3 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</span>
                      <p className="font-medium text-gray-900 dark:text-white">{product.category}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Condition</span>
                      <p className="font-medium text-gray-900 dark:text-white">{product.condition}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Price</span>
                      <p className="font-bold text-blue-600 dark:text-blue-400 text-2xl">
                        ₹{Number(product.price || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Seller</span>
                      <p className="font-medium text-gray-900 dark:text-white">{ownerName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">
                        {product.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                {isSeller ? (
                  <div className="flex-1 rounded-lg bg-gray-100 dark:bg-slate-700 py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                    You listed this item
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAllImages(false)
                      handleOpenChat()
                    }}
                    disabled={startingChat}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 shadow-md"
                  >
                    {startingChat ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    )}
                    Chat with Seller & Make Offer
                  </button>
                )}

                <button
                  onClick={() => setShowAllImages(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Chat Modal */}
      {isChatOpen && activeChat && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          conversation={activeChat}
          counterpartyName={ownerName}
        />
      )}
    </div>
  )
}
