import React, { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import toast from 'react-hot-toast'

export const UPI_REGEX = /^[\w.-]+@[\w.-]+$/

/**
 * Onboarding modal for adding or updating seller UPI ID.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} [props.onSuccess]
 * @param {string} [props.currentUpi]
 */
export default function OnboardingModal({
  isOpen,
  onClose,
  onSuccess,
  currentUpi = ''
}) {
  const [upiInput, setUpiInput] = useState(currentUpi || '')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleSave = async (e) => {
    e?.preventDefault()
    const sanitized = upiInput.trim().toLowerCase()

    if (!sanitized) {
      setErrorMsg('UPI ID is required to receive payments from buyers.')
      return
    }

    if (!UPI_REGEX.test(sanitized)) {
      setErrorMsg('Invalid UPI ID format. Example: yourname@oksbi or 9876543210@paytm')
      return
    }

    if (!auth.currentUser) {
      toast.error('You must be logged in to save your UPI ID.')
      return
    }

    setSaving(true)
    setErrorMsg('')

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid)
      await setDoc(
        userRef,
        {
          upiId: sanitized,
          updatedAt: new Date()
        },
        { merge: true }
      )

      toast.success('UPI ID saved successfully! You can now create listings.', { icon: '💳' })
      if (onSuccess) onSuccess(sanitized)
      onClose()
    } catch (err) {
      console.error('Failed to save UPI ID:', err)
      setErrorMsg(err.message || 'Failed to save UPI ID. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl shrink-0">
            💳
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Seller UPI Setup
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Receive direct bank payments on MANIT Mart
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-3 mb-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>Why is this required?</strong> When students buy your items, MANIT Mart dynamically generates a UPI QR code with your UPI ID so payment lands directly in your bank account with zero middleman fees.
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Your UPI ID (VPA)
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="e.g. 9876543210@paytm or name@oksbi"
                value={upiInput}
                onChange={(e) => {
                  setUpiInput(e.target.value)
                  if (errorMsg) setErrorMsg('')
                }}
                className={`input input-bordered w-full bg-gray-50 dark:bg-slate-700/60 text-gray-900 dark:text-white ${
                  errorMsg ? 'input-error' : 'border-gray-300 dark:border-slate-600'
                }`}
              />
            </div>
            {errorMsg ? (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errorMsg}</p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-1">
                Supported: Google Pay, PhonePe, Paytm, BHIM, Amazon Pay.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-ghost flex-1 rounded-xl text-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !upiInput.trim()}
              className="btn btn-primary flex-1 text-white rounded-xl shadow-md"
            >
              {saving ? <span className="loading loading-spinner loading-xs"></span> : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
