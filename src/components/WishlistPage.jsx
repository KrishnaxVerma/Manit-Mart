import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useWishlist } from '../hooks/useWishlist'
import { getOptimizedCloudinaryUrl } from '../utils/productImages'
import ChatModal from './ChatModal'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const { wishlistItems, loading: wishlistLoading, toggleWishlist } = useWishlist()
  const [liveProducts, setLiveProducts] = useState({})
  const [selectedItem, setSelectedItem] = useState(null) // for image/details modal
  const [activeChat, setActiveChat] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [startingChatId, setStartingChatId] = useState(null)
  const nav = useNavigate()

  const currentUserId = auth.currentUser?.uid

  // Real-time synchronization with actual products collection to detect price drops & status changes
  useEffect(() => {
    if (!wishlistItems || wishlistItems.length === 0) {
      setLiveProducts({})
      return
    }

    const unsubs = wishlistItems.map((item) => {
      const prodRef = doc(db, 'products', item.listingId)
      return onSnapshot(
        prodRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setLiveProducts((prev) => ({
              ...prev,
              [item.listingId]: { id: docSnap.id, ...docSnap.data() }
            }))
          } else {
            // Product might have been deleted by seller
            setLiveProducts((prev) => ({
              ...prev,
              [item.listingId]: { status: 'DELETED' }
            }))
          }
        },
        () => {}
      )
    })

    return () => {
      unsubs.forEach((unsub) => unsub && unsub())
    }
  }, [wishlistItems])

  // Open real-time chat with seller
  const handleOpenChat = async (item, liveData, e) => {
    e?.stopPropagation()

    if (!currentUserId) {
      toast.error('Please log in to chat with the seller')
      nav('/login')
      return
    }

    const sellerId = liveData?.sellerId || item.sellerId
    if (sellerId === currentUserId) {
      toast('This is your own listing', { icon: 'ℹ️' })
      return
    }

    const listingId = item.listingId
    setStartingChatId(listingId)

    try {
      const chatId = `${listingId}_${currentUserId}`
      const convRef = doc(db, 'conversations', chatId)
      const convSnap = await getDoc(convRef)

      let conversationData
      if (convSnap.exists()) {
        conversationData = { id: convSnap.id, ...convSnap.data() }
      } else {
        const primaryImage =
          (liveData?.imageUrls && liveData.imageUrls[0]) ||
          (item.images && item.images[0]) ||
          ''

        conversationData = {
          id: chatId,
          listingId: listingId,
          listingTitle: liveData?.title || item.title || 'Product',
          listingPrice: Number(liveData?.price ?? item.price) || 0,
          listingImage: primaryImage,
          sellerId: sellerId,
          buyerId: currentUserId,
          participants: [sellerId, currentUserId],
          lastMessage: '',
          lastUpdated: serverTimestamp(),
          unreadCount: {
            [sellerId]: 0,
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
      setStartingChatId(null)
    }
  }

  const handleRemove = async (item, e) => {
    e?.stopPropagation()
    try {
      await toggleWishlist(item)
    } catch (err) {
      toast.error('Could not remove item')
    }
  }

  if (wishlistLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 text-gray-500">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
        <p className="text-sm font-medium">Loading your saved items...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Saved Items
              </h1>
              <span className="badge badge-primary font-semibold">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track prices, check availability, and negotiate directly with sellers
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <Link
              to="/buy"
              className="btn btn-outline btn-sm rounded-lg self-start sm:self-auto dark:border-slate-700 dark:text-gray-200"
            >
              ← Back to Marketplace
            </Link>
          )}
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-800 p-12 text-center max-w-2xl mx-auto my-12 shadow-xs">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-10 h-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
              Browse campus listings and save items you want to keep an eye on! We'll track price drops and alert you when prices fall.
            </p>
            <Link
              to="/buy"
              className="btn btn-primary px-8 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Explore Feed
            </Link>
          </div>
        ) : (
          /* Responsive Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => {
              const liveData = liveProducts[item.listingId]
              const currentPrice = Number(liveData?.price ?? item.price ?? 0)
              const addedPrice = Number(item.addedPrice ?? currentPrice)
              const priceDrop = addedPrice > currentPrice ? addedPrice - currentPrice : 0

              // Determine status
              const rawStatus = (liveData?.status || item.status || 'AVAILABLE').toUpperCase()
              const isUnavailable = rawStatus === 'SOLD' || rawStatus === 'RESERVED' || rawStatus === 'DELETED'
              const isDeleted = rawStatus === 'DELETED'

              const primaryImage =
                (liveData?.imageUrls && liveData.imageUrls[0]) ||
                (item.images && item.images[0]) ||
                ''
              const optimizedThumb = getOptimizedCloudinaryUrl(primaryImage, 'w_400,c_scale')

              const title = liveData?.title || item.title || 'Product Listing'
              const pickupLocation =
                liveData?.pickupLocation ||
                liveData?.hostel ||
                item.pickupLocation ||
                'MANIT Campus'

              return (
                <div
                  key={item.listingId}
                  onClick={() => setSelectedItem({ ...item, ...liveData })}
                  className={`group relative flex flex-col bg-white dark:bg-slate-800/90 rounded-2xl border transition-all duration-200 hover:shadow-xl cursor-pointer overflow-hidden ${
                    isUnavailable
                      ? 'border-gray-200 dark:border-slate-800 opacity-90'
                      : 'border-gray-200 dark:border-slate-700/80 hover:border-blue-500/50'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-4/3 w-full bg-gray-100 dark:bg-slate-900 overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={optimizedThumb}
                        alt={title}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          isUnavailable ? 'grayscale-40' : ''
                        }`}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}

                    <div
                      className="absolute inset-0 bg-gray-200 dark:bg-slate-800 flex items-center justify-center text-gray-400 text-xs"
                      style={{ display: primaryImage ? 'none' : 'flex' }}
                    >
                      No Image
                    </div>

                    {/* Status Overlays */}
                    {rawStatus === 'SOLD' && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="badge badge-error badge-lg font-bold text-white uppercase tracking-wider py-3 px-4 shadow-lg">
                          Sold Out
                        </span>
                      </div>
                    )}

                    {rawStatus === 'RESERVED' && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                        <span className="badge badge-warning badge-lg font-bold text-gray-900 uppercase tracking-wider py-3 px-4 shadow-lg">
                          Reserved
                        </span>
                      </div>
                    )}

                    {isDeleted && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="badge badge-neutral badge-lg font-bold text-white uppercase tracking-wider py-3 px-4 shadow-lg">
                          Listing Removed
                        </span>
                      </div>
                    )}

                    {/* Quick Remove Trash Icon */}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(item, e)}
                      title="Remove from wishlist"
                      aria-label="Remove item"
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 shadow-md transition-all active:scale-90"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Location Chip */}
                    <div className="absolute bottom-2 left-2 max-w-[85%]">
                      <span className="badge badge-sm bg-black/60 backdrop-blur-xs text-white border-none text-[11px] truncate">
                        📍 {pickupLocation}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col flex-1 p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate text-base mb-1">
                      {title}
                    </h3>

                    {/* Price and Price Drop Alert */}
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ₹{currentPrice.toLocaleString('en-IN')}
                      </span>
                      {addedPrice !== currentPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{addedPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Price Drop Indicator */}
                    {priceDrop > 0 && !isUnavailable && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-3 border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in">
                        <span>📉</span>
                        <span>Price dropped by ₹{priceDrop.toLocaleString('en-IN')}!</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedItem({ ...item, ...liveData })
                        }}
                        className="btn btn-ghost btn-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-medium"
                      >
                        View Item
                      </button>

                      <button
                        type="button"
                        disabled={isUnavailable || startingChatId === item.listingId}
                        onClick={(e) => handleOpenChat(item, liveData, e)}
                        className={`btn btn-xs flex-1 rounded-lg font-semibold text-white transition ${
                          isUnavailable
                            ? 'btn-disabled opacity-50'
                            : 'btn-primary'
                        }`}
                      >
                        {startingChatId === item.listingId ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          'Chat Seller'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedItem.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Saved on {selectedItem.savedAt?.toDate ? selectedItem.savedAt.toDate().toLocaleDateString() : 'recently'}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="btn btn-ghost btn-circle btn-sm text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-900 mb-4 border border-gray-100 dark:border-slate-700">
              <img
                src={
                  (selectedItem.images && selectedItem.images[0]) ||
                  (selectedItem.imageUrls && selectedItem.imageUrls[0]) ||
                  ''
                }
                alt={selectedItem.title}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-slate-900/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Current Price</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  ₹{Number(selectedItem.price || 0).toLocaleString('en-IN')}
                </span>
              </div>
              {selectedItem.addedPrice && selectedItem.addedPrice > selectedItem.price && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  🎉 Dropped from ₹{Number(selectedItem.addedPrice).toLocaleString('en-IN')} when you saved it!
                </div>
              )}
              {selectedItem.description && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Description</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Pickup Location</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                  📍 {selectedItem.pickupLocation || selectedItem.hostel || 'MANIT Campus'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  const target = selectedItem
                  setSelectedItem(null)
                  handleOpenChat(target, target)
                }}
                className="btn btn-primary flex-1 text-white font-semibold"
              >
                Chat with Seller & Make Offer
              </button>
              <button
                type="button"
                onClick={(e) => {
                  handleRemove(selectedItem, e)
                  setSelectedItem(null)
                }}
                className="btn btn-outline btn-error"
              >
                Remove from Saved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time chat modal */}
      {isChatOpen && activeChat && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          conversation={activeChat}
        />
      )}
    </div>
  )
}
