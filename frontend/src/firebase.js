import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const cfg = {
  apiKey: "AIzaSyDUIoYDlCMIXxemITGe_B8D3wxvCc7est8",
  authDomain: "manit-mart.firebaseapp.com",
  projectId: "manit-mart",
  storageBucket: "manit-mart.firebasestorage.app",
  messagingSenderId: "112543678583",
  appId: "1:112543678583:web:c60a787340a6be23dbc672",
  measurementId: "G-SV0PEQGK0B"
}

const app = initializeApp(cfg)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const gProvider = new GoogleAuthProvider()
export { sendEmailVerification }
export default app

