import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import ChatModal from './ChatModal'

/**
 * Format timestamp into short date / time for conversation list items.
 */
const formatConversationTime = (timestamp) => {
  if (!timestamp) return ''
  let date
  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate()
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else {
    date = new Date(timestamp)
  }

  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Messages() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'buying' | 'selling'
  const nav = useNavigate()

  const currentUserId = auth.currentUser?.uid

  useEffect(() => {
    if (!auth.currentUser) {
      nav('/login')
      return
    }

    setLoading(true)

    // Listen to conversations where current user is a participant
    const convsRef = collection(db, 'conversations')
    const q = query(convsRef, where('participants', 'array-contains', auth.currentUser.uid))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          }))
          // Only show conversations that have at least one message or offer exchanged
          .filter((c) => Boolean(c.lastMessage && c.lastMessage.trim() !== ''))

        // Sort in memory by lastUpdated desc (avoids composite index requirement)
        list.sort((a, b) => {
          const tA = a.lastUpdated?.toDate ? a.lastUpdated.toDate().getTime() : 0
          const tB = b.lastUpdated?.toDate ? b.lastUpdated.toDate().getTime() : 0
          return tB - tA
        })

        setConversations(list)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching conversations:', err)
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [currentUserId, nav])

  const filteredList = conversations.filter((c) => {
    if (filterTab === 'buying') return c.buyerId === currentUserId
    if (filterTab === 'selling') return c.sellerId === currentUserId
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messages & Offers</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time chats and negotiations with fellow MANIT students
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="join bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-1 rounded-xl shadow-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`join-item btn btn-xs sm:btn-sm border-none ${
                filterTab === 'all'
                  ? 'btn-primary text-white shadow-xs'
                  : 'bg-transparent text-gray-600 dark:text-gray-300'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setFilterTab('buying')}
              className={`join-item btn btn-xs sm:btn-sm border-none ${
                filterTab === 'buying'
                  ? 'btn-primary text-white shadow-xs'
                  : 'bg-transparent text-gray-600 dark:text-gray-300'
              }`}
            >
              Buying
            </button>
            <button
              onClick={() => setFilterTab('selling')}
              className={`join-item btn btn-xs sm:btn-sm border-none ${
                filterTab === 'selling'
                  ? 'btn-primary text-white shadow-xs'
                  : 'bg-transparent text-gray-600 dark:text-gray-300'
              }`}
            >
              Selling
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <span className="loading loading-spinner loading-lg text-blue-600"></span>
            <p className="text-sm">Loading conversations...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center shadow-xs">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
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
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {filterTab === 'all'
                ? 'No conversations yet'
                : `No ${filterTab} conversations`}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2">
              Browse products from other campus students to start chatting or list items for sale to receive buyer offers.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => nav('/buy')}
                className="btn btn-primary btn-sm px-6 text-white"
              >
                Browse Marketplace
              </button>
              <button
                onClick={() => nav('/sell')}
                className="btn btn-outline btn-sm px-6 dark:border-slate-700 dark:text-gray-200"
              >
                Sell an Item
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((conv) => {
              const isSeller = conv.sellerId === currentUserId
              const roleBadge = isSeller ? 'Buyer inquiry' : 'Seller'
              const unread = conv.unreadCount?.[currentUserId] || 0

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700/80 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition shadow-xs hover:shadow-md cursor-pointer group"
                >
                  {/* Listing thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0 border border-gray-100 dark:border-slate-600">
                    {conv.listingImage ? (
                      <img
                        src={conv.listingImage}
                        alt={conv.listingTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-400 text-xs">
                        Item
                      </div>
                    )}
                    {unread > 0 && (
                      <span className="absolute top-1 right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-slate-800"></span>
                    )}
                  </div>

                  {/* Main summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate text-base">
                          {conv.listingTitle || 'Item Thread'}
                        </h4>
                        <span
                          className={`badge badge-xs text-[10px] font-medium py-1 px-2 ${
                            isSeller
                              ? 'badge-secondary'
                              : 'badge-accent'
                          }`}
                        >
                          {roleBadge}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatConversationTime(conv.lastUpdated)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm truncate ${
                          unread > 0
                            ? 'font-bold text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {conv.lastMessage || 'No messages yet. Tap to start chatting.'}
                      </p>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          ₹{Number(conv.listingPrice || 0).toLocaleString('en-IN')}
                        </span>
                        {unread > 0 && (
                          <span className="badge badge-primary badge-sm font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Real-time chat modal */}
      {selectedConversation && (
        <ChatModal
          isOpen={Boolean(selectedConversation)}
          onClose={() => setSelectedConversation(null)}
          conversation={selectedConversation}
        />
      )}
    </div>
  )
}
