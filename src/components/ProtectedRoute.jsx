import { Navigate } from 'react-router-dom'
import { auth } from '../firebase'

export default function ProtectedRoute({ children }) {
  const user = auth.currentUser
  if (!user) return <Navigate to="/login" replace />
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />
  return children
}
