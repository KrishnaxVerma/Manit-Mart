import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { doc, runTransaction, serverTimestamp, deleteField } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import toast from 'react-hot-toast'

/**
 * Handshake Verification Modal / Card for Seller to verify Buyer OTP.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.listingId
 * @param {string} [props.listingTitle]
 * @param {Function} [props.onVerified]
 * @param {Function} [props.sendMessage]
 */
export default function VerifyOtpModal({
  isOpen,
  onClose,
  listingId,
  listingTitle = 'Product',
  onVerified,
  sendMessage
}) {
  const [otpInput, setOtpInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen || !listingId) return null

  const handleVerify = async (e) => {
    e?.preventDefault()
    const sanitizedOtp = otpInput.trim()

    if (!sanitizedOtp || sanitizedOtp.length !== 4) {
      setErrorMsg('Please enter a valid 4-digit OTP.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const productRef = doc(db, 'products', listingId)

      // Execute Firestore atomic runTransaction
      await runTransaction(db, async (transaction) => {
        const productSnap = await transaction.get(productRef)
        if (!productSnap.exists()) {
          throw new Error('Listing document no longer exists.')
        }

        const data = productSnap.data()

        if (data.status !== 'RESERVED') {
          throw new Error(`Listing is currently ${data.status || 'not reserved'}.`)
        }

        if (String(data.handshakeOtp).trim() !== sanitizedOtp) {
          throw new Error('Incorrect OTP. Please verify the 4-digit code shown on the buyer’s phone.')
        }

        // Atomic update: transition to SOLD, record completion timestamp, remove handshakeOtp
        transaction.update(productRef, {
          status: 'SOLD',
          completedAt: serverTimestamp(),
          handshakeOtp: deleteField()
        })
      })

      // Send automated system chat message
      if (sendMessage) {
        await sendMessage('🎉 Transaction completed successfully! Item has been verified and marked as SOLD.')
      }

      toast.success('Handshake Verified! Item successfully marked as SOLD.', { duration: 5000, icon: '🤝' })
      if (onVerified) onVerified()
      onClose()
    } catch (err) {
      console.error('OTP Verification Transaction Failed:', err)
      setErrorMsg(err.message || 'Verification failed. Please check the OTP.')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="btn btn-ghost btn-circle btn-sm absolute right-4 top-4 text-gray-400 hover:text-gray-700 dark:hover:text-white"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 text-2xl shrink-0">
            🤝
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Confirm Item Handover
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Item: <strong className="text-gray-700 dark:text-gray-200">{listingTitle}</strong>
            </p>
          </div>
        </div>

        <div className="p-3 mb-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
          <strong>Campus Handshake Verification:</strong> Once you hand over the item to the buyer on campus, ask them for their <strong>4-digit Handshake OTP</strong> to mark this sale as completed.
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Enter Buyer's 4-Digit OTP
            </label>
            <input
              type="text"
              autoFocus
              maxLength={4}
              placeholder="e.g. 4821"
              value={otpInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setOtpInput(val)
                if (errorMsg) setErrorMsg('')
              }}
              className={`input input-bordered w-full text-center tracking-widest text-3xl font-mono font-bold bg-gray-50 dark:bg-slate-700/60 text-gray-900 dark:text-white ${
                errorMsg ? 'input-error' : 'border-gray-300 dark:border-slate-600'
              }`}
            />
            {errorMsg && (
              <p className="text-xs text-red-500 mt-1.5 font-medium text-center">
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-ghost flex-1 rounded-xl text-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || otpInput.trim().length !== 4}
              className="btn btn-success flex-1 text-white rounded-xl font-semibold shadow-md"
            >
              {submitting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                'Confirm Delivery'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
