import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export const UPI_REGEX = /^[\w.-]+@[\w.-]+$/

export default function Profile() {
  const [u, setU] = useState(null)
  const [prof, setProf] = useState(null)
  const [ld, setLd] = useState(true)
  const [isEd, setIsEd] = useState(false)
  const [frm, setFrm] = useState({ name: '', hostel: '', upiId: '' })
  const [upiError, setUpiError] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (usr) => {
      if (usr) {
        setU(usr)
        try {
          const docRef = doc(db, 'users', usr.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            setProf(data)
            setFrm({
              name: data.name || '',
              hostel: data.hostel || '',
              upiId: data.upiId || ''
            })
          } else {
            const defaultData = {
              name: '',
              hostel: '',
              upiId: '',
              role: 'student',
              email: usr.email
            }
            await setDoc(docRef, defaultData, { merge: true })
            setProf(defaultData)
            setFrm({ name: '', hostel: '', upiId: '' })
          }
        } catch (err) {
          toast.error('Failed to load profile')
        }
      } else {
        nav('/login')
      }
      setLd(false)
    })
    return unsub
  }, [nav])

  const save = async () => {
    if (!u) return
    const sanitizedUpi = frm.upiId.trim().toLowerCase()

    if (sanitizedUpi && !UPI_REGEX.test(sanitizedUpi)) {
      setUpiError('Invalid UPI ID format. Example: name@oksbi or 9876543210@paytm')
      return
    }

    setUpiError('')
    try {
      const userRef = doc(db, 'users', u.uid)
      const updatedData = {
        name: frm.name.trim(),
        hostel: frm.hostel.trim(),
        upiId: sanitizedUpi,
        updatedAt: new Date()
      }

      await setDoc(userRef, updatedData, { merge: true })
      setProf({ ...prof, ...updatedData })
      setIsEd(false)
      toast.success('Profile updated successfully!')
    } catch (err) {
      console.error('Failed to update profile:', err)
      toast.error('Failed to update profile')
    }
  }

  const cancel = () => {
    setFrm({
      name: prof?.name || '',
      hostel: prof?.hostel || '',
      upiId: prof?.upiId || ''
    })
    setUpiError('')
    setIsEd(false)
  }

  if (ld) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!u) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Details</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Manage your student identity and payment settings
              </p>
            </div>
            {!isEd && (
              <button
                onClick={() => setIsEd(true)}
                className="btn btn-outline btn-sm rounded-xl"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Full Name
              </label>
              {isEd ? (
                <input
                  type="text"
                  value={frm.name}
                  onChange={(e) => setFrm({ ...frm, name: e.target.value })}
                  className="input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600"
                  placeholder="Enter full name"
                />
              ) : (
                <div className="px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white font-medium">
                  {prof?.name || 'Not set'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Email Address (Institutional)
              </label>
              <input
                type="email"
                value={u.email}
                disabled
                className="input input-bordered w-full bg-gray-100 dark:bg-slate-700/60 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-200 dark:border-slate-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Hostel / Residence
              </label>
              {isEd ? (
                <input
                  type="text"
                  value={frm.hostel}
                  onChange={(e) => setFrm({ ...frm, hostel: e.target.value })}
                  className="input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600"
                  placeholder="e.g. Hostel 7, Hostel 10, Day Scholar"
                />
              ) : (
                <div className="px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white font-medium">
                  {prof?.hostel || 'Not set'}
                </div>
              )}
            </div>

            {/* UPI ID Field with regex validation */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Seller UPI ID (for P2P Settlements)
                </label>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  Required to Sell
                </span>
              </div>
              {isEd ? (
                <div>
                  <input
                    type="text"
                    value={frm.upiId}
                    onChange={(e) => {
                      setFrm({ ...frm, upiId: e.target.value })
                      if (upiError) setUpiError('')
                    }}
                    placeholder="e.g. 9876543210@paytm or name@oksbi"
                    className={`input input-bordered w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white ${
                      upiError ? 'input-error' : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                  {upiError ? (
                    <p className="text-xs text-red-500 mt-1 font-medium">{upiError}</p>
                  ) : (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Enables dynamic in-chat QR generation so buyers can pay directly to your bank account.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700">
                  <span className="font-mono text-gray-900 dark:text-white font-semibold">
                    {prof?.upiId || 'No UPI ID configured'}
                  </span>
                  {prof?.upiId ? (
                    <span className="badge badge-success badge-sm text-white font-semibold">Active</span>
                  ) : (
                    <span className="badge badge-warning badge-sm font-semibold">Not Set</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Role
              </label>
              <div className="px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white capitalize font-medium">
                {prof?.role || 'student'}
              </div>
            </div>
          </div>

          {isEd && (
            <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
              <button
                onClick={save}
                className="btn btn-primary flex-1 text-white rounded-xl"
              >
                Save Changes
              </button>
              <button
                onClick={cancel}
                className="btn btn-outline flex-1 rounded-xl dark:border-slate-600 dark:text-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
