import { useWishlistContext } from '../context/WishlistContext'

/**
 * Custom hook to interact with the current student's Wishlist.
 *
 * @returns {Object} {
 *   wishlistIds: Set<string>,
 *   wishlistItems: Array<Object>,
 *   loading: boolean,
 *   toggleWishlist: (listing: Object) => Promise<boolean>,
 *   isWishlisted: (listingId: string) => boolean
 * }
 */
export function useWishlist() {
  return useWishlistContext()
}

export default useWishlist
