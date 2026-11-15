import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { getProductImages } from './productImages'
import { clearLegacyReservation } from './reservations'

export async function getOrCreateConversation(product, buyerId = auth.currentUser?.uid) {
  const user = auth.currentUser
  if (!user || !buyerId || buyerId !== user.uid || !product?.id || !product?.sellerId || product.sellerId === buyerId) {
    throw new Error('A valid listing and buyer account are required to start a chat.')
  }

  const chatId = `${product.id}_${buyerId}`
  const conversationRef = doc(db, 'conversations', chatId)
  const existingConversation = await getDoc(conversationRef)
  if (existingConversation.exists()) {
    const data = existingConversation.data()
    if (data.buyerId !== buyerId || data.sellerId !== product.sellerId) {
      throw new Error('This chat does not match the listing participants.')
    }
    return { id: existingConversation.id, ...data }
  }

  const productRef = doc(db, 'products', product.id)
  let productSnapshot = await getDoc(productRef)
  if (!productSnapshot.exists()) {
    throw new Error('This listing is no longer available.')
  }
  let currentProduct = productSnapshot.data()
  if (currentProduct.sellerId !== product.sellerId) {
    throw new Error('This listing has changed. Refresh the Buy page and try again.')
  }
  if (currentProduct.status === 'RESERVED') {
    try {
      await clearLegacyReservation(product.id)
      productSnapshot = await getDoc(productRef)
      currentProduct = productSnapshot.exists() ? productSnapshot.data() : null
    } catch (error) {
      console.error('Could not clear the legacy listing hold before opening chat:', error)
      throw new Error('Could not clear an old listing hold. Refresh and try again.')
    }
  }
  if (!currentProduct || (currentProduct.status || 'AVAILABLE') !== 'AVAILABLE') {
    const error = new Error('This listing is no longer available. The Buy list will refresh.')
    error.code = 'listing-unavailable'
    throw error
  }

  const conversation = {
    id: chatId,
    listingId: product.id,
    listingTitle: String(product.title || 'Product').slice(0, 200),
    listingPrice: Number.isFinite(Number(product.price)) ? Math.max(0, Number(product.price)) : 0,
    listingImage: (getProductImages(product)[0] || '').slice(0, 10000),
    sellerId: product.sellerId,
    buyerId,
    participants: [product.sellerId, buyerId],
    lastMessage: '',
    lastUpdated: serverTimestamp(),
    unreadCount: { [product.sellerId]: 0, [buyerId]: 0 }
  }

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(conversationRef)
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() }
    transaction.set(conversationRef, conversation)
    return { ...conversation, lastUpdated: new Date() }
  })
}
