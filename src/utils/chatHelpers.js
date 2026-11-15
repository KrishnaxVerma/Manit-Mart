import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { getProductImages } from './productImages'

export async function getOrCreateConversation(product, buyerId = auth.currentUser?.uid) {
  if (!buyerId || !product?.id || !product?.sellerId || product.sellerId === buyerId) {
    throw new Error('A valid listing and buyer account are required to start a chat.')
  }

  const chatId = `${product.id}_${buyerId}`
  const conversationRef = doc(db, 'conversations', chatId)
  const conversation = {
    id: chatId,
    listingId: product.id,
    listingTitle: product.title || 'Product',
    listingPrice: Number(product.price) || 0,
    listingImage: getProductImages(product)[0] || '',
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
