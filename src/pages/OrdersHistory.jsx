import React, { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { Link, useNavigate } from 'react-router-dom'
import { getOptimizedCloudinaryUrl, getProductImages } from '../utils/productImages'

/**
 * OrdersHistory page displaying "Items Bought" and "Items Sold" (P2P Settlements).
 */
export default function OrdersHistory() {
  const [activeTab, setActiveTab] = useState('purchases') // 'purchases' | 'sales'
  const [purchases, setPurchases] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  const currentUserId = auth.currentUser?.uid

  useEffect(() => {
    if (!auth.currentUser) {
      nav('/login')
      return
    }

    setLoading(true)
    const productsRef = collection(db, 'products')

    // Query 1: Purchases (buyerId == current user & status == 'SOLD')
    const purchasesQuery = query(
      productsRef,
      where('buyerId', '==', auth.currentUser.uid),
      where('status', '==', 'SOLD')
    )

    // Query 2: Sales (sellerId == current user & status == 'SOLD')
    const salesQuery = query(
      productsRef,
      where('sellerId', '==', auth.currentUser.uid),
      where('status', '==', 'SOLD')
    )

    let purchasesLoaded = false
    let salesLoaded = false

    const checkDone = () => {
      if (purchasesLoaded && salesLoaded) setLoading(false)
    }

    const unsubPurchases = onSnapshot(
      purchasesQuery,
      (snap) => {
        const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        list.sort((a, b) => {
          const aT = a.completedAt?.toDate ? a.completedAt.toDate().getTime() : 0
          const bT = b.completedAt?.toDate ? b.completedAt.toDate().getTime() : 0
          return bT - aT
        })
        setPurchases(list)
        purchasesLoaded = true
        checkDone()
      },
      (err) => {
        console.error('Purchases query error:', err)
        purchasesLoaded = true
        checkDone()
      }
    )

    const unsubSales = onSnapshot(
      salesQuery,
      (snap) => {
        const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        list.sort((a, b) => {
          const aT = a.completedAt?.toDate ? a.completedAt.toDate().getTime() : 0
          const bT = b.completedAt?.toDate ? b.completedAt.toDate().getTime() : 0
          return bT - aT
        })
        setSales(list)
        salesLoaded = true
        checkDone()
      },
      (err) => {
        console.error('Sales query error:', err)
        salesLoaded = true
        checkDone()
      }
    )

    return () => {
      unsubPurchases()
      unsubSales()
    }
  }, [currentUserId, nav])

  const renderProductCard = (item, isPurchase) => {
    const images = getProductImages(item)
    const thumb = images.length > 0 ? getOptimizedCloudinaryUrl(images[0], 'w_400,c_scale') : ''
    const dateStr = item.completedAt?.toDate
      ? item.completedAt.toDate().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : 'Recently'

    const price = item.dealPrice || item.price || 0

    return (
      <div
        key={item.id}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-xs hover:shadow-md transition"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-gray-100 dark:border-slate-600">
            {thumb ? (
              <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                Item
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                {item.title}
              </h4>
              <span className="badge badge-success badge-sm text-white font-bold gap-1 py-2">
                ✓ Handshake Verified
              </span>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
              <p>
                {isPurchase ? (
                  <>Seller: <strong className="text-gray-700 dark:text-gray-300">{item.sellerName || 'Student'}</strong></>
                ) : (
                  <>Buyer: <strong className="text-gray-700 dark:text-gray-300">{item.buyerName || 'Student'}</strong></>
                )}
              </p>
              <p>Completed on: {dateStr}</p>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-700 gap-2 shrink-0">
          <span className="text-2xl font-black text-gray-900 dark:text-white">
            ₹{Number(price).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-gray-400">
            P2P Direct Settled
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Order & Settlement History
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Verified campus peer-to-peer transactions and handshake receipts
            </p>
          </div>

          <Link
            to="/account"
            className="btn btn-outline btn-sm rounded-xl dark:border-slate-700 dark:text-gray-300 self-start sm:self-auto"
          >
            ← Back to Account
          </Link>
        </div>

        {/* Tab Controls */}
        <div className="join bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 mb-6 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('purchases')}
            className={`join-item btn btn-sm border-none rounded-xl font-semibold transition ${
              activeTab === 'purchases'
                ? 'btn-primary text-white shadow-xs'
                : 'bg-transparent text-gray-600 dark:text-gray-300'
            }`}
          >
            🛍️ Items Bought ({purchases.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`join-item btn btn-sm border-none rounded-xl font-semibold transition ${
              activeTab === 'sales'
                ? 'btn-primary text-white shadow-xs'
                : 'bg-transparent text-gray-600 dark:text-gray-300'
            }`}
          >
            🏷️ Items Sold ({sales.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <span className="loading loading-spinner loading-lg text-blue-600"></span>
            <p className="text-sm font-medium">Loading transaction history...</p>
          </div>
        ) : activeTab === 'purchases' ? (
          purchases.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-12 text-center shadow-xs">
              <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl">
                🛍️
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                No purchases completed yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                When you buy an item from another student and verify delivery via Handshake OTP, your receipt will appear here.
              </p>
              <Link to="/buy" className="btn btn-primary px-6 text-white rounded-xl shadow-md">
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((item) => renderProductCard(item, true))}
            </div>
          )
        ) : sales.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-12 text-center shadow-xs">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-3xl">
              🏷️
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              No sales completed yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
              When you sell an item and verify the buyer’s 4-digit OTP during handover, your sales log and earnings record will show here.
            </p>
            <Link to="/sell" className="btn btn-primary px-6 text-white rounded-xl shadow-md">
              Sell an Item
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((item) => renderProductCard(item, false))}
          </div>
        )}
      </div>
    </div>
  )
}
