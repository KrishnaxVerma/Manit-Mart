import React, { useState } from 'react'
import { useWishlist } from '../hooks/useWishlist'
import { auth } from '../firebase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

/**
 * Interactive Wishlist / Saved item heart button.
 *
 * @param {Object} props
 * @param {Object} props.listing - The listing object (must contain id or listingId).
 * @param {string} [props.className] - Optional Tailwind CSS classes for custom sizing/positioning.
 * @param {boolean} [props.showLabel] - Whether to display text label next to the heart icon.
 */
export default function WishlistButton({
  listing,
  className = '',
  showLabel = false
}) {
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [animating, setAnimating] = useState(false)
  const nav = useNavigate()

  const listingId = listing?.id || listing?.listingId
  const saved = isWishlisted(listingId)

  const handleClick = async (e) => {
    e.stopPropagation()
    e.preventDefault()

    if (!auth.currentUser) {
      toast('Please log in to save items to your wishlist', {
        icon: '🔒',
        duration: 3000
      })
      nav('/login')
      return
    }

    // Trigger pulse / bounce micro-animation
    setAnimating(true)
    setTimeout(() => setAnimating(false), 300)

    try {
      await toggleWishlist(listing)
    } catch (err) {
      console.error('Wishlist toggle error:', err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`group relative inline-flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-90 focus:outline-none ${className}`}
    >
      <div
        className={`flex items-center justify-center p-1.5 rounded-full transition-colors duration-200 ${
          saved
            ? 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'
            : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white dark:bg-slate-800/90 dark:text-gray-400 dark:hover:text-red-400'
        } ${animating ? 'scale-125' : 'scale-100'} shadow-xs`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
            saved
              ? 'fill-red-500 text-red-500 dark:fill-red-400 dark:text-red-400'
              : 'fill-none stroke-current stroke-2'
          }`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </div>

      {showLabel && (
        <span
          className={`text-xs font-medium select-none ${
            saved
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-300 group-hover:text-red-500'
          }`}
        >
          {saved ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  )
}
