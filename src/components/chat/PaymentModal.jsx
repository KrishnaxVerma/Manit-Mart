import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { QRCodeSVG } from 'qrcode.react'
import { db, auth } from '../../firebase'
import toast from 'react-hot-toast'

/**
 * In-chat Payment Modal with dynamic UPI QR code, deep-linking, and OTP reservation.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object} props.conversation - The active conversation object
 * @param {Function} props.onPaymentInitiated - Callback after user marks as paid with OTP
 * @param {Function} props.sendMessage - Hook method to send system message to chat
 * @param {number} [props.defaultAmount] - Negotiated or initial price
 */
export default function PaymentModal({
  isOpen,
  onClose,
  conversation,
  onPaymentInitiated,
  sendMessage,
  defaultAmount
}) {
  const [sellerUpi, setSellerUpi] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [loadingSeller, setLoadingSeller] = useState(true)
  const [amount, setAmount] = useState(defaultAmount || conversation?.listingPrice || 0)
  const [generatedOtp, setGeneratedOtp] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const listingId = conversation?.listingId
  const sellerId = conversation?.sellerId
  const currentUserId = auth.currentUser?.uid

  useEffect(() => {
    if (isOpen) {
      const activePrice = Number(defaultAmount) || Number(conversation?.listingPrice) || 0
      setAmount(activePrice)
      setGeneratedOtp(null)
    }
  }, [isOpen, defaultAmount, conversation?.listingPrice])

  // Fetch seller profile to get their UPI ID
  useEffect(() => {
    if (!isOpen || !sellerId) return

    let isMounted = true
    setLoadingSeller(true)

    const fetchSellerData = async () => {
      try {
        const sellerSnap = await getDoc(doc(db, 'users', sellerId))
        if (isMounted && sellerSnap.exists()) {
          const data = sellerSnap.data()
          setSellerUpi(data.upiId || '')
          setSellerName(data.name || conversation?.sellerName || 'MANIT Seller')
        }
      } catch (err) {
        console.error('Failed to load seller UPI info:', err)
      } finally {
        if (isMounted) setLoadingSeller(false)
      }
    }

    fetchSellerData()
    return () => {
      isMounted = false
    }
  }, [isOpen, sellerId, conversation?.sellerName])

  if (!isOpen) return null

  const numericAmount = Math.max(0, Number(amount) || 0)
  const upiUri = sellerUpi
    ? `upi://pay?pa=${sellerUpi}&pn=${encodeURIComponent(
        sellerName || 'Seller'
      )}&am=${numericAmount}&cu=INR&tn=${encodeURIComponent(`MANITMart-${listingId}`)}`
    : ''

  // Buyer marks as paid -> Generates 4-digit Handshake OTP
  const handleConfirmPaid = async () => {
    if (!listingId || !currentUserId) return
    setProcessing(true)

    try {
      const otp = Math.floor(1000 + Math.random() * 9000).toString()
      const productRef = doc(db, 'products', listingId)

      const buyerName =
        auth.currentUser.displayName ||
        auth.currentUser.email?.split('@')[0] ||
        'Student Buyer'

      // 1. Update listing document to RESERVED with buyerId and handshakeOtp
      await updateDoc(productRef, {
        status: 'RESERVED',
        buyerId: currentUserId,
        buyerName,
        handshakeOtp: otp,
        dealPrice: numericAmount,
        reservedAt: serverTimestamp()
      })

      // 2. Post automated system announcement in chat
      if (sendMessage) {
        await sendMessage(
          `🔔 Payment initiated! Deal Price: ₹${numericAmount.toLocaleString(
            'en-IN'
          )}. Item status is now RESERVED. Handshake OTP generated for secure in-person delivery.`
        )
      }

      setGeneratedOtp(otp)
      toast.success('Item marked as RESERVED! Save your Handshake OTP.', { duration: 4000 })
      if (onPaymentInitiated) onPaymentInitiated(otp)
    } catch (err) {
      console.error('Error reserving listing:', err)
      toast.error('Failed to reserve listing. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const copyUpiId = () => {
    if (!sellerUpi) return
    navigator.clipboard.writeText(sellerUpi)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('UPI ID copied to clipboard!')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6 overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn btn-ghost btn-circle btn-sm absolute right-4 top-4 text-gray-400 hover:text-gray-700 dark:hover:text-white"
        >
          ✕
        </button>

        {/* If OTP was just generated, show the OTP Handshake Screen */}
        {generatedOtp ? (
          <div className="text-center py-3">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-3xl shadow-inner">
              🤝
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
              Payment Recorded!
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Listing is now <span className="badge badge-warning badge-sm font-bold">RESERVED</span> for you.
            </p>

            <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-3xl p-6 mb-6">
              <span className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
                Your 4-Digit Handshake OTP
              </span>
              <div className="text-4xl font-mono font-black tracking-widest text-amber-900 dark:text-amber-200 my-2 select-all">
                {generatedOtp}
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 font-medium leading-relaxed mt-2">
                ⚠️ <strong>Important:</strong> Meet the seller on campus (Library, Hostel Gate, SAC). Inspect your item, and share this OTP with the seller <em>only after receiving the item</em>.
              </p>
            </div>

            <button
              onClick={onClose}
              className="btn btn-primary w-full text-white rounded-xl shadow-lg"
            >
              Back to Chat
            </button>
          </div>
        ) : (
          /* Payment QR & Details Screen */
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl font-bold shrink-0">
                ₹
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Pay Seller via UPI
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Zero commission & instant campus P2P transfer
                </p>
              </div>
            </div>

            {loadingSeller ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                <span className="loading loading-spinner loading-md text-blue-600"></span>
                <p className="text-xs">Fetching seller payment details...</p>
              </div>
            ) : !sellerUpi ? (
              /* Seller Has No UPI Configured */
              <div className="py-6 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 text-2xl">
                  ⚠️
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                  Seller UPI Not Set
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4 leading-relaxed">
                  The seller hasn't configured their UPI ID yet. Ask them in chat to add their UPI ID in their Account Profile so you can scan and pay!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (sendMessage) {
                      sendMessage("Hi! Could you please add your UPI ID to your profile so I can make the payment via UPI?")
                    }
                    onClose()
                  }}
                  className="btn btn-outline btn-sm rounded-xl font-medium"
                >
                  Ask Seller in Chat
                </button>
              </div>
            ) : (
              /* Seller UPI Found: Render QR and Pay Buttons */
              <div className="space-y-4">
                {/* Deal Amount Input */}
                <div className="bg-gray-50 dark:bg-slate-700/50 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-600">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                      {Number(defaultAmount) > 0 && Number(defaultAmount) !== Number(conversation?.listingPrice) ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <span>🏷️</span> Accepted Offer Price
                        </span>
                      ) : (
                        'Deal Price'
                      )}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Item: {conversation?.listingTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-500">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value) || 0)}
                      className="input input-sm input-ghost text-2xl font-black text-gray-900 dark:text-white w-full p-0 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-inner">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <QRCodeSVG
                      value={upiUri}
                      size={180}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Scan with Any UPI App
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Google Pay, PhonePe, Paytm, BHIM, CRED
                    </p>
                  </div>
                </div>

                {/* Seller VPA Info */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-700/40 border border-gray-200 dark:border-slate-600 text-xs">
                  <div className="truncate pr-2">
                    <span className="text-gray-400 block text-[10px]">Recipient:</span>
                    <strong className="text-gray-800 dark:text-gray-200 font-mono truncate block">
                      {sellerUpi}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="btn btn-ghost btn-xs text-blue-600 dark:text-blue-400 font-semibold shrink-0"
                  >
                    {copied ? '✓ Copied' : 'Copy UPI'}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  {/* Direct Mobile UPI Intent */}
                  <a
                    href={upiUri}
                    className="btn btn-outline btn-primary w-full rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <span>📱</span>
                    <span>Pay with UPI App (Mobile)</span>
                  </a>

                  {/* "I Have Paid" Confirmation */}
                  <button
                    type="button"
                    onClick={handleConfirmPaid}
                    disabled={processing || numericAmount <= 0}
                    className="btn btn-primary w-full text-white rounded-xl text-sm font-semibold shadow-md"
                  >
                    {processing ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'I Have Paid — Get Handshake OTP'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
