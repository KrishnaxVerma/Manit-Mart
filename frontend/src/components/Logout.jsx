import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Logout() {
  const nav = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('Logged out')
      nav('/')
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
  }

  return (
    <button className='px-3 py-2 bg-red-500 text-white rounded cursor-pointer hover:bg-red-600' onClick={handleLogout}>
      Logout
    </button>
  )
}
