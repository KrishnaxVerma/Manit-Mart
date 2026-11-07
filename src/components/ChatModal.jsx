import { useState, useEffect, useRef } from 'react'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useChat } from '../hooks/useChat'
import toast from 'react-hot-toast'

/**
 * Format Firestore timestamp or Date into human-readable time string.
 *
 * @param {any} timestamp
 * @returns {string}
 */
const formatMessageTime = (timestamp) => {
  if (!timestamp) return 'Sending...'

  let date
  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate()
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  } else {
    date = new Date(timestamp)
  }

  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isToday) {
    return timeStr
  }

  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return `${dateStr}, ${timeStr}`
}

/**
 * ChatModal / ChatDrawer component for real-time negotiations between buyer and seller.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls visibility.
 * @param {Function} props.onClose - Modal close handler.
 * @param {Object} props.conversation - Conversation data or listing metadata.
 * @param {string} props.conversation.id - Conversation ID (`{listingId}_{buyerId}`).
 * @param {string} props.conversation.listingId - Product ID.
 * @param {string} props.conversation.listingTitle - Product Title.
 * @param {number} props.conversation.listingPrice - Product Price.
 * @param {string} props.conversation.listingImage - Product Thumbnail URL.
 * @param {string} props.conversation.sellerId - Seller UID.
 * @param {string} props.conversation.buyerId - Buyer UID.
 * @param {string} [props.counterpartyName] - Display name of the other person.
 */
export default function ChatModal({
  isOpen,
  onClose,
  conversation,
  counterpartyName: initialCounterpartyName
}) {
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerInput, setOfferInput] = useState('')
  const [counterpartyName, setCounterpartyName] = useState(initialCounterpartyName || '')
  const inputRef = useRef(null)

  const currentUserId = auth.currentUser?.uid
  const isSeller = currentUserId === conversation?.sellerId
  const counterpartyId = isSeller ? conversation?.buyerId : conversation?.sellerId
  const counterpartyRole = isSeller ? 'Buyer' : 'Seller'

  const {
    messages,
    loading,
    error,
    sendMessage,
    sendOffer,
    messagesEndRef,
    scrollToBottom
  } = useChat(conversation?.id, { otherParticipantId: counterpartyId })

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        scrollToBottom('auto')
      }, 150)
    }
  }, [isOpen, scrollToBottom])

  // Resolve counterparty name if not passed in
  useEffect(() => {
    let active = true

    if (initialCounterpartyName) {
      setCounterpartyName(initialCounterpartyName)
      return
    }

    if (!counterpartyId) return

    const fetchName = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', counterpartyId))
        if (active && userSnap.exists()) {
          const data = userSnap.data()
          setCounterpartyName(data.name || data.email?.split('@')[0] || 'Student')
        }
      } catch (err) {
        console.error('Failed to fetch user name:', err)
      }
    }

    fetchName()

    return () => {
      active = false
    }
  }, [counterpartyId, initialCounterpartyName])

  // Handle standard message submission
  const handleSend = async (e) => {
    e?.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      await sendMessage(trimmed)
      setInputText('')
      inputRef.current?.focus()
    } catch (err) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Handle offer submission
  const handleOfferSubmit = async (e) => {
    e?.preventDefault()
    const amount = Number(offerInput)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setSending(true)
    try {
      await sendOffer(amount)
      setShowOfferModal(false)
      setOfferInput('')
      toast.success(`Offer of ₹${amount.toLocaleString('en-IN')} sent!`)
    } catch (err) {
      toast.error(err.message || 'Failed to send offer')
    } finally {
      setSending(false)
    }
  }

  // Quick preset calculation for offers
  const calculatePreset = (percentage) => {
    const base = Number(conversation?.listingPrice) || 0
    if (!base) return 0
    return Math.round(base * (1 - percentage / 100))
  }

  if (!isOpen || !conversation) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex flex-col w-full max-w-2xl h-[92vh] sm:h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= TOP BAR ================= */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Listing Thumbnail */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shrink-0">
              {conversation.listingImage ? (
                <img
                  src={conversation.listingImage}
                  alt={conversation.listingTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">
                  No Pic
                </div>
              )}
            </div>

            {/* Listing Title & Price & Counterparty */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {conversation.listingTitle || 'Listing Chat'}
                </h3>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 shrink-0">
                  ₹{Number(conversation.listingPrice || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  {counterpartyRole}:{' '}
                  <strong className="text-gray-700 dark:text-gray-200">
                    {counterpartyName || 'Student'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            aria-label="Close chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ================= MESSAGE FEED ================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-950/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <span className="loading loading-spinner loading-md text-blue-600"></span>
              <p className="text-sm">Connecting to secure chat...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500 text-sm p-4 text-center">
              <p>Error: {error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 mb-3 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">No messages yet</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mt-1">
                Say hello, ask about the item condition, or send an offer to negotiate!
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => sendMessage('Hi, is this still available?')}
                  className="btn btn-outline btn-xs rounded-full border-gray-300 dark:border-slate-700"
                >
                  "Hi, is this still available?"
                </button>
                <button
                  type="button"
                  onClick={() => setShowOfferModal(true)}
                  className="btn btn-primary btn-xs rounded-full"
                >
                  Make an Offer
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isSentByMe = msg.senderId === currentUserId

              return (
                <div
                  key={msg.id}
                  className={`chat ${isSentByMe ? 'chat-end' : 'chat-start'} group`}
                >
                  <div className="chat-header text-xs text-gray-400 mb-1 px-1">
                    {isSentByMe ? 'You' : counterpartyName || 'Student'}{' '}
                    <time className="text-[10px] opacity-70 ml-1">
                      {formatMessageTime(msg.createdAt)}
                    </time>
                  </div>

                  {msg.isOffer ? (
                    /* Offer Card in Chat Bubble */
                    <div
                      className={`chat-bubble max-w-sm p-4 rounded-2xl shadow-md border ${
                        isSentByMe
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-amber-300/60 dark:border-amber-600/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-warning badge-sm font-bold gap-1 py-2">
                          🏷️ Price Offer
                        </span>
                        <span className="text-xs opacity-80">
                          {isSentByMe ? 'You proposed' : 'Proposed to you'}
                        </span>
                      </div>

                      <div className="text-2xl font-black tracking-tight my-1">
                        ₹{Number(msg.offerAmount || 0).toLocaleString('en-IN')}
                      </div>

                      {conversation.listingPrice && (
                        <div className="text-xs opacity-80 mb-3">
                          Original Price: ₹{Number(conversation.listingPrice).toLocaleString('en-IN')} (
                          {Math.round(
                            ((conversation.listingPrice - (msg.offerAmount || 0)) /
                              conversation.listingPrice) *
                              100
                          )}
                          % off)
                        </div>
                      )}

                      {!isSentByMe && (
                        <div className="flex gap-2 pt-2 border-t border-gray-200/40 dark:border-slate-700/60 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              sendMessage(
                                `I accept your offer of ₹${Number(
                                  msg.offerAmount
                                ).toLocaleString('en-IN')}! When can we meet on campus?`
                              )
                            }}
                            className="btn btn-xs btn-success text-white flex-1"
                          >
                            Accept Offer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOfferInput(String(msg.offerAmount || ''))
                              setShowOfferModal(true)
                            }}
                            className="btn btn-xs btn-outline flex-1 dark:text-white"
                          >
                            Counter
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Standard Message Bubble */
                    <div
                      className={`chat-bubble max-w-md break-words rounded-2xl text-sm leading-relaxed ${
                        isSentByMe
                          ? 'chat-bubble-primary bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-700 shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ================= OFFER POPUP / INLINE FORM ================= */}
        {showOfferModal && (
          <div className="border-t border-amber-200 dark:border-amber-900/60 bg-amber-50/95 dark:bg-amber-950/50 p-4 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏷️</span>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                  Make a Price Offer
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
              >
                ✕ Cancel
              </button>
            </div>

            {/* Quick discount chips */}
            {conversation.listingPrice && (
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 text-xs">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Quick Options:</span>
                {[10, 15, 20].map((pct) => {
                  const presetPrice = calculatePreset(pct)
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setOfferInput(String(presetPrice))}
                      className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-gray-200 hover:border-blue-500 font-medium shrink-0 transition"
                    >
                      -{pct}% (₹{presetPrice.toLocaleString('en-IN')})
                    </button>
                  )
                })}
              </div>
            )}

            <form onSubmit={handleOfferSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount"
                  value={offerInput}
                  onChange={(e) => setOfferInput(e.target.value)}
                  className="input input-bordered input-sm w-full pl-7 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-300 dark:border-slate-700"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={sending || !offerInput}
                className="btn btn-primary btn-sm px-4"
              >
                {sending ? 'Sending...' : 'Send Offer'}
              </button>
            </form>
          </div>
        )}

        {/* ================= BOTTOM INPUT BAR ================= */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* Make an Offer Button */}
            <button
              type="button"
              onClick={() => setShowOfferModal(!showOfferModal)}
              className={`btn btn-sm shrink-0 gap-1.5 transition ${
                showOfferModal
                  ? 'btn-warning text-gray-900'
                  : 'btn-outline border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
              title="Propose a custom price"
            >
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <span className="hidden sm:inline">Make Offer</span>
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="input input-bordered input-sm flex-1 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="btn btn-primary btn-sm px-4 shrink-0 text-white"
            >
              {sending ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </form>
          <div className="mt-1 text-[11px] text-gray-400 text-center">
            🔒 Safe Campus Trading: Coordinate handover in public areas (Hostel Main Gate, Library, SAC).
          </div>
        </div>
      </div>
    </div>
  )
}
