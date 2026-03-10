import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import Navbar from './Navbar'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Profile() {
  const [u, setU] = useState(null)
  const [prof, setProf] = useState(null)
  const [ld, setLd] = useState(true)
  const [isEd, setIsEd] = useState(false)
  const [frm, setFrm] = useState({ name: '', hostel: '' })
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
            setFrm({ name: data.name || '', hostel: data.hostel || '' })
          } else {
            const defaultData = { name: '', hostel: '', role: 'student', email: usr.email }
            await setDoc(docRef, defaultData)
            setProf(defaultData)
            setFrm({ name: '', hostel: '' })
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
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        name: frm.name,
        hostel: frm.hostel
      })
      setProf({ ...prof, name: frm.name, hostel: frm.hostel })
      setIsEd(false)
      toast.success('Profile updated')
    } catch (err) {
      toast.error('Failed to update')
    }
  }

  const cancel = () => {
    setFrm({ name: prof?.name || '', hostel: prof?.hostel || '' })
    setIsEd(false)
  }

  if (ld) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!u) return null

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                {isEd ? (
                  <input
                    type="text"
                    value={frm.name}
                    onChange={(e) => setFrm({ ...frm, name: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                ) : (
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {prof?.name || 'Not set'}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={u.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hostel</label>
                {isEd ? (
                  <input
                    type="text"
                    value={frm.hostel}
                    onChange={(e) => setFrm({ ...frm, hostel: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                ) : (
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    {prof?.hostel || 'Not set'}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  {prof?.role || 'student'}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              {isEd ? (
                <>
                  <button
                    onClick={save}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancel}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEd(true)}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}