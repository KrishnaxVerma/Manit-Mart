import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const app = initializeApp(cfg)
export const auth = getAuth(app)

// Set session-only persistence so user is logged out when tab/browser is closed
setPersistence(auth, browserSessionPersistence).catch((err) => {
  console.warn('Could not set browserSessionPersistence:', err)
})

export const db = getFirestore(app)
export const functions = getFunctions(app, 'asia-south1')

// Connect to functions emulator if explicitly configured during local development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true') {
  connectFunctionsEmulator(functions, 'localhost', 5001)
}

export const gProvider = new GoogleAuthProvider()
export { sendEmailVerification }
export default app
