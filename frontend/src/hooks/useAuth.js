import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

export const useAuth = () => {
  const [usr, setUsr] = useState(null)
  const [ld, setLd] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUsr(u)
      setLd(false)
    })
    return unsub
  }, [])

  return { usr, ld }
}
