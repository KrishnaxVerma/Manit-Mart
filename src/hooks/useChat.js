import { useState, useEffect, useRef, useCallback } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  setDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDoc
} from 'firebase/firestore'
import { db, auth } from '../firebase'

/**
 * Custom hook for managing a real-time chat conversation between buyer and seller.
 *
 * @param {string} chatId - Conversation document ID (`${listingId}_${buyerId}`).
 * @param {Object} options - Additional options including otherParticipantId.
 * @returns {Object} { messages, loading, error, sendMessage, sendOffer, messagesEndRef, scrollToBottom }
 */
export function useChat(chatId, { otherParticipantId } = {}) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  // Smooth scroll to bottom of the message feed
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
  }, [])

  // Subscribe to real-time messages subcollection
  useEffect(() => {
    if (!chatId) {
      setMessages([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const messagesRef = collection(db, 'conversations', chatId, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        setMessages(msgs)
        setLoading(false)

        // Clear unread count for current user if conversation doc exists
        const currentUserId = auth.currentUser?.uid
        if (currentUserId) {
          const convDocRef = doc(db, 'conversations', chatId)
          updateDoc(convDocRef, {
            [`unreadCount.${currentUserId}`]: 0
          }).catch(() => {
            // Non-critical if update fails (e.g., initial empty conversation)
          })
        }
      },
      (err) => {
        console.error('Error listening to chat messages:', err)
        setError(err.message || 'Failed to load messages')
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [chatId])

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('auto')
    }
  }, [messages, scrollToBottom])

  // Helper to determine recipient for unreadCount increments
  const getRecipientId = useCallback(async () => {
    if (otherParticipantId) return otherParticipantId
    if (!chatId) return null

    try {
      const convSnap = await getDoc(doc(db, 'conversations', chatId))
      if (convSnap.exists()) {
        const data = convSnap.data()
        const currentUserId = auth.currentUser?.uid
        return data.participants?.find((uid) => uid !== currentUserId) || null
      }
    } catch {
      // Fallback
    }
    return null
  }, [chatId, otherParticipantId])

  /**
   * Send a standard text message.
   *
   * @param {string} text
   */
  const sendMessage = useCallback(
    async (text) => {
      const currentUserId = auth.currentUser?.uid
      const trimmed = text?.trim()

      if (!trimmed || !chatId || !currentUserId) {
        return
      }

      const messagesRef = collection(db, 'conversations', chatId, 'messages')
      const convDocRef = doc(db, 'conversations', chatId)

      try {
        // 1. Add message to subcollection
        await addDoc(messagesRef, {
          senderId: currentUserId,
          text: trimmed,
          createdAt: serverTimestamp(),
          isOffer: false,
          offerAmount: null
        })

        // 2. Update conversation header
        const recipientId = await getRecipientId()
        const updatePayload = {
          lastMessage: trimmed,
          lastUpdated: serverTimestamp()
        }

        if (recipientId) {
          updatePayload[`unreadCount.${recipientId}`] = increment(1)
        }

        await updateDoc(convDocRef, updatePayload).catch(async () => {
          // If updateDoc fails (e.g. document needs creation/merge)
          await setDoc(convDocRef, updatePayload, { merge: true })
        })

        scrollToBottom('smooth')
      } catch (err) {
        console.error('Failed to send message:', err)
        throw err
      }
    },
    [chatId, getRecipientId, scrollToBottom]
  )

  /**
   * Send a structured price offer.
   *
   * @param {number|string} amount
   */
  const sendOffer = useCallback(
    async (amount) => {
      const currentUserId = auth.currentUser?.uid
      const numericAmount = Number(amount)

      if (!numericAmount || numericAmount <= 0 || !chatId || !currentUserId) {
        throw new Error('Please enter a valid offer amount.')
      }

      const offerText = `Offer made: ₹${numericAmount.toLocaleString('en-IN')}`
      const messagesRef = collection(db, 'conversations', chatId, 'messages')
      const convDocRef = doc(db, 'conversations', chatId)

      try {
        // 1. Add offer message to subcollection
        await addDoc(messagesRef, {
          senderId: currentUserId,
          text: offerText,
          createdAt: serverTimestamp(),
          isOffer: true,
          offerAmount: numericAmount
        })

        // 2. Update conversation header
        const recipientId = await getRecipientId()
        const updatePayload = {
          lastMessage: offerText,
          lastUpdated: serverTimestamp()
        }

        if (recipientId) {
          updatePayload[`unreadCount.${recipientId}`] = increment(1)
        }

        await updateDoc(convDocRef, updatePayload).catch(async () => {
          await setDoc(convDocRef, updatePayload, { merge: true })
        })

        scrollToBottom('smooth')
      } catch (err) {
        console.error('Failed to send offer:', err)
        throw err
      }
    },
    [chatId, getRecipientId, scrollToBottom]
  )

  return {
    messages,
    loading,
    error,
    sendMessage,
    sendOffer,
    messagesEndRef,
    scrollToBottom
  }
}

export default useChat
