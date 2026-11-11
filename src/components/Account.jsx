import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useWishlist } from '../hooks/useWishlist'
import { getOptimizedCloudinaryUrl } from '../utils/productImages'
import ChatModal from './ChatModal'
import toast from 'react-hot-toast'

export const UPI_REGEX = /^[\w.-]+@[\w.-]+$/

export default function Account() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(activeTabParam === 'saved' ? 'saved' : 'profile')

  // Profile States
  const [u, setU] = useState(null)
  const [prof, setProf] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [frm, setFrm] = useState({ name: '', hostel: '', upiId: '' })
  const [upiError, setUpiError] = useState('')

  // Wishlist States
  const { wishlistItems, loading: wishlistLoading, toggleWishlist } = useWishlist()
  const [liveProducts, setLiveProducts] = useState({})
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [startingChatId, setStartingChatId] = useState(null)

  const nav = useNavigate()
  const currentUserId = auth.currentUser?.uid

  // Sync tab with URL search parameter
  useEffect(() => {
    if (activeTabParam === 'saved' || activeTabParam === 'wishlist') {
      setActiveTab('saved')
    } else if (activeTabParam === 'profile') {
      setActiveTab('profile')
    }
  }, [activeTabParam])

  const switchTab = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  // Load User & Profile Data
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (usr) => {
      if (usr) {
        setU(usr)
        try {
          const docRef = doc(db, 'users', usr.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            setProf(data)
            setFrm({
              name: data.name || '',
              hostel: data.hostel || '',
              upiId: data.upiId || ''
            })
          } else {
            const defaultData = {
              name: '',
              hostel: '',
              upiId: '',
              role: 'student',
              email: usr.email
            }
            await setDoc(docRef, defaultData, { merge: true })
            setProf(defaultData)
            setFrm({ name: '', hostel: '', upiId: '' })
          }
        } catch (err) {
          toast.error('Failed to load profile')
        }
      } else {
        nav('/login')
      }
      setProfileLoading(false)
    })
    return unsub
  }, [nav])

  // Profile Actions
  const handleSaveProfile = async () => {
    if (!u) return
    const sanitizedUpi = frm.upiId.trim().toLowerCase()

    if (sanitizedUpi && !UPI_REGEX.test(sanitizedUpi)) {
      setUpiError('Invalid UPI ID format. Example: name@oksbi or 9876543210@paytm')
      return
    }

    setUpiError('')
    try {
      const userRef = doc(db, 'users', u.uid)
      const updatedData = {
        name: frm.name.trim(),
        hostel: frm.hostel.trim(),
        upiId: sanitizedUpi,
        updatedAt: new Date()
      }

      await setDoc(userRef, updatedData, { merge: true })
      setProf({ ...prof, ...updatedData })
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error('Failed to update profile')
    }
  }

  const handleCancelProfile = () => {
    setFrm({
      name: prof?.name || '',
      hostel: prof?.hostel || '',
      upiId: prof?.upiId || ''
    })
    setUpiError('')
    setIsEditing(false)
  }

  // Real-time synchronization of wishlisted products
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

  // Chat with Seller
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

  const handleRemoveFromWishlist = async (item, e) => {
    e?.stopPropagation()
    try {
      await toggleWishlist(item)
    } catch (err) {
      toast.error('Could not remove item')
    }
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 text-gray-500">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
        <p className="text-sm font-medium">Loading account details...</p>
      </div>
    )
  }

  if (!u) return null

  const displayName = prof?.name || u.displayName || u.email.split('@')[0]
  const initials = (displayName || 'S')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= USER HERO HEADER ================= */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700/80 p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
              {initials}
            </div>

            {/* User Meta */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {displayName}
                </h1>
                <span className="badge badge-primary badge-sm font-semibold uppercase tracking-wide self-center sm:self-auto">
                  {prof?.role || 'MANIT Student'}
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
                {u.email}
              </p>

              {/* Quick Stat Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <div
                  onClick={() => switchTab('saved')}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 transition"
                >
                  <span>❤️</span>
                  <span>{wishlistItems.length} Saved {wishlistItems.length === 1 ? 'Item' : 'Items'}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  <span>✓</span>
                  <span>Verified College Email</span>
                </div>

                {prof?.hostel && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-semibold">
                    <span>🏢</span>
                    <span>{prof.hostel}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= TABS SWITCHER ================= */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="grid grid-cols-2 sm:flex bg-gray-100 dark:bg-slate-900 p-1.5 rounded-2xl w-full sm:w-auto gap-1.5">
              <button
                type="button"
                onClick={() => switchTab('profile')}
                className={`btn btn-sm border-none rounded-xl font-semibold gap-1.5 sm:gap-2 transition-all px-2.5 sm:px-4 ${
                  activeTab === 'profile'
                    ? 'btn-primary text-white shadow-xs'
                    : 'bg-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold truncate">
                  <span className="inline sm:hidden">Profile</span>
                  <span className="hidden sm:inline">Profile & Details</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchTab('saved')}
                className={`btn btn-sm border-none rounded-xl font-semibold gap-1.5 sm:gap-2 transition-all px-2.5 sm:px-4 ${
                  activeTab === 'saved'
                    ? 'btn-primary text-white shadow-xs'
                    : 'bg-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold truncate">
                  <span className="inline sm:hidden">Saved</span>
                  <span className="hidden sm:inline">Saved Items</span>
                </span>
                {wishlistItems.length > 0 && (
                  <span className={`badge badge-xs px-1.5 py-0.5 font-bold shrink-0 ${activeTab === 'saved' ? 'bg-white text-blue-600' : 'badge-primary text-white'}`}>
                    {wishlistItems.length}
                  </span>
                )}
              </button>
            </div>

            <Link
              to="/orders"
              className="btn btn-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-100 border-none rounded-2xl font-semibold gap-2 shadow-xs transition w-full sm:w-auto justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xs sm:text-sm">My Orders & Sales</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 opacity-60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ================= TAB 1: PROFILE TAB ================= */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700/80 p-6 sm:p-8 max-w-2xl mx-auto shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Profile Details
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Your campus identity used during transactions and chats
                </p>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn btn-outline btn-sm rounded-xl font-medium dark:border-slate-600 dark:text-gray-200"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={frm.name}
                    onChange={(e) => setFrm({ ...frm, name: e.target.value })}
                    placeholder="Enter your name"
                    className="input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white font-medium">
                    {prof?.name || 'Not set'}
                  </div>
                )}
              </div>

              {/* College Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  College Email (Locked)
                </label>
                <div className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 font-medium cursor-not-allowed">
                  {u.email}
                </div>
              </div>

              {/* Hostel / Residence */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Hostel / Residence
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={frm.hostel}
                    onChange={(e) => setFrm({ ...frm, hostel: e.target.value })}
                    placeholder="e.g. Hostel 7, Hostel 10, Day Scholar"
                    className="input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white font-medium">
                    {prof?.hostel || 'Not set'}
                  </div>
                )}
              </div>

              {/* UPI ID (Settlements) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    UPI ID (For Receiving Payments)
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">e.g. 9876543210@paytm</span>
                </div>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={frm.upiId}
                      onChange={(e) => {
                        setFrm({ ...frm, upiId: e.target.value })
                        if (upiError) setUpiError('')
                      }}
                      placeholder="e.g. yourname@oksbi"
                      className={`input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 font-mono text-sm ${upiError ? 'border-error ring-1 ring-error' : ''}`}
                    />
                    {upiError && (
                      <p className="text-xs text-error mt-1.5 font-medium">{upiError}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">
                      Required for creating listings and receiving instant buyer payments.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600">
                    <span className="font-mono text-sm text-gray-900 dark:text-white font-medium">
                      {prof?.upiId || (
                        <span className="text-amber-500 dark:text-amber-400 font-sans italic text-xs">
                          ⚠️ Not set (Required to post items for sale)
                        </span>
                      )}
                    </span>
                    {prof?.upiId && (
                      <span className="badge badge-success badge-sm text-[10px] text-white">Active</span>
                    )}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Role
                </label>
                <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white font-medium capitalize">
                  {prof?.role || 'student'}
                </div>
              </div>
            </div>

            {/* Editing Save/Cancel Buttons */}
            {isEditing && (
              <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="btn btn-primary flex-1 text-white rounded-xl"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancelProfile}
                  className="btn btn-outline flex-1 rounded-xl dark:border-slate-600 dark:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: SAVED ITEMS / WISHLIST TAB ================= */}
        {activeTab === 'saved' && (
          <div className="animate-in fade-in duration-200">
            {wishlistLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
                <p className="text-sm font-medium">Loading saved items...</p>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-800 p-12 text-center max-w-2xl mx-auto shadow-xs">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No saved items yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 text-sm leading-relaxed">
                  Browse campus listings and tap the heart icon on any product to save it here. We'll track price drops for you!
                </p>
                <Link
                  to="/buy"
                  className="btn btn-primary px-6 text-white rounded-xl shadow-md"
                >
                  Explore Marketplace
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {wishlistItems.map((item) => {
                  const liveData = liveProducts[item.listingId]
                  const currentPrice = Number(liveData?.price ?? item.price ?? 0)
                  const addedPrice = Number(item.addedPrice ?? currentPrice)
                  const priceDrop = addedPrice > currentPrice ? addedPrice - currentPrice : 0

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
                      {/* Image Thumbnail */}
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

                        {/* Remove Trash Button */}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveFromWishlist(item, e)}
                          title="Remove from saved"
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 shadow-md transition-all active:scale-90"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                          </svg>
                        </button>

                        <div className="absolute bottom-2 left-2 max-w-[85%]">
                          <span className="badge badge-sm bg-black/60 backdrop-blur-xs text-white border-none text-[11px] truncate">
                            📍 {pickupLocation}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="flex flex-col flex-1 p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate text-base mb-1">
                          {title}
                        </h4>

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

                        {priceDrop > 0 && !isUnavailable && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-3 border border-emerald-200 dark:border-emerald-800/60">
                            <span>📉</span>
                            <span>Price dropped by ₹{priceDrop.toLocaleString('en-IN')}!</span>
                          </div>
                        )}

                        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedItem({ ...item, ...liveData })
                            }}
                            className="btn btn-ghost btn-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-medium"
                          >
                            View
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
        )}
      </div>

      {/* Item Details Preview Modal */}
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
                  🎉 Dropped from ₹{Number(selectedItem.addedPrice).toLocaleString('en-IN')} when saved!
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
                Chat with Seller
              </button>
              <button
                type="button"
                onClick={(e) => {
                  handleRemoveFromWishlist(selectedItem, e)
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
