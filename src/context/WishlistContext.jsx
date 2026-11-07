import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import toast from 'react-hot-toast'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser)
  const [wishlistItems, setWishlistItems] = useState([])
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  // Track auth state changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (!user) {
        setWishlistItems([])
        setWishlistIds(new Set())
        setLoading(false)
      }
    })
    return () => unsubAuth()
  }, [])

  // Real-time Firestore subscription to users/{userId}/wishlist
  useEffect(() => {
    if (!currentUser) {
      setWishlistItems([])
      setWishlistIds(new Set())
      setLoading(false)
      return
    }

    setLoading(true)
    const wishlistRef = collection(db, 'users', currentUser.uid, 'wishlist')
    // We order by savedAt descending so newly saved items appear at top
    const q = query(wishlistRef, orderBy('savedAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          listingId: docSnap.id
        }))
        setWishlistItems(items)
        setWishlistIds(new Set(items.map((item) => item.listingId)))
        setLoading(false)
      },
      (error) => {
        console.error('Error fetching wishlist:', error)
        // Fallback without orderBy in case savedAt index is pending or null
        const fallbackUnsub = onSnapshot(
          wishlistRef,
          (fallbackSnap) => {
            const items = fallbackSnap.docs.map((docSnap) => ({
              ...docSnap.data(),
              listingId: docSnap.id
            }))
            // Sort in memory by savedAt desc
            items.sort((a, b) => {
              const timeA = a.savedAt?.toDate ? a.savedAt.toDate().getTime() : 0
              const timeB = b.savedAt?.toDate ? b.savedAt.toDate().getTime() : 0
              return timeB - timeA
            })
            setWishlistItems(items)
            setWishlistIds(new Set(items.map((item) => item.listingId)))
            setLoading(false)
          },
          (err) => {
            console.error('Wishlist fallback snapshot error:', err)
            setLoading(false)
          }
        )
        return () => fallbackUnsub()
      }
    )

    return () => unsubscribe()
  }, [currentUser])

  // Instant O(1) check
  const isWishlisted = useCallback(
    (listingId) => {
      if (!listingId) return false
      return wishlistIds.has(String(listingId))
    },
    [wishlistIds]
  )

  /**
   * Toggle item in wishlist with Optimistic UI updates and rollback.
   *
   * @param {Object} listing - The listing object to bookmark or remove
   * @returns {Promise<boolean>} true if added, false if removed
   */
  const toggleWishlist = useCallback(
    async (listing) => {
      if (!auth.currentUser) {
        toast.error('Please log in to save items to your wishlist')
        return false
      }

      const listingId = String(listing?.id || listing?.listingId || '')
      if (!listingId) {
        toast.error('Invalid listing')
        return false
      }

      const userId = auth.currentUser.uid
      const alreadySaved = wishlistIds.has(listingId)

      // Normalize images array for denormalized preview
      const previewImages = Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0
        ? listing.imageUrls
        : Array.isArray(listing.images) && listing.images.length > 0
          ? listing.images
          : [listing.imageUrl || listing.image || ''].filter(Boolean)

      const addedPrice = Number(listing.price) || 0

      const newItemData = {
        listingId,
        addedPrice,
        savedAt: new Date(), // temporary optimistic timestamp
        title: listing.title || 'Untitled Listing',
        price: addedPrice,
        images: previewImages,
        pickupLocation:
          listing.pickupLocation ||
          listing.hostel ||
          listing.condition ||
          'MANIT Campus',
        sellerId: listing.sellerId || '',
        status: listing.status || 'AVAILABLE'
      }

      // Snapshot previous state for rollback
      const prevIds = new Set(wishlistIds)
      const prevItems = [...wishlistItems]

      // 1. OPTIMISTIC UPDATE: Update state immediately
      if (alreadySaved) {
        const nextIds = new Set(prevIds)
        nextIds.delete(listingId)
        setWishlistIds(nextIds)
        setWishlistItems(prevItems.filter((item) => item.listingId !== listingId))
      } else {
        const nextIds = new Set(prevIds)
        nextIds.add(listingId)
        setWishlistIds(nextIds)
        setWishlistItems([newItemData, ...prevItems])
      }

      // 2. FIRESTORE NETWORK CALL
      try {
        const docRef = doc(db, 'users', userId, 'wishlist', listingId)

        if (alreadySaved) {
          await deleteDoc(docRef)
          toast.success('Removed from wishlist', { id: `wishlist-${listingId}`, icon: '💔' })
          return false
        } else {
          await setDoc(docRef, {
            ...newItemData,
            savedAt: serverTimestamp()
          })
          toast.success('Saved to wishlist!', { id: `wishlist-${listingId}`, icon: '❤️' })
          return true
        }
      } catch (err) {
        console.error('Failed to update wishlist in Firestore:', err)
        // 3. ROLLBACK ON ERROR
        setWishlistIds(prevIds)
        setWishlistItems(prevItems)
        toast.error('Failed to update wishlist. Please try again.')
        return alreadySaved
      }
    },
    [wishlistIds, wishlistItems]
  )

  const value = useMemo(
    () => ({
      wishlistIds,
      wishlistItems,
      loading,
      toggleWishlist,
      isWishlisted
    }),
    [wishlistIds, wishlistItems, loading, toggleWishlist, isWishlisted]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlistContext() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}

export default WishlistContext
