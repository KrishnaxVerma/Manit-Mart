import { deleteField, doc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'

const OTP_VALIDITY_MS = 5 * 60 * 1000

export async function releaseExpiredLegacyReservation(productId) {
  const productRef = doc(db, 'products', productId)
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(productRef)
    if (!snapshot.exists()) return false

    const product = snapshot.data()
    if (product.status !== 'RESERVED') return false

    const expiry = product.otpExpiresAt?.toMillis?.() ??
      (product.reservedAt?.toMillis?.() ? product.reservedAt.toMillis() + OTP_VALIDITY_MS : 0)
    if (expiry > Date.now()) return false

    transaction.update(productRef, {
      status: 'AVAILABLE',
      buyerId: deleteField(),
      dealPrice: deleteField(),
      handshakeOtp: deleteField(),
      reservedAt: deleteField(),
      otpExpiresAt: deleteField()
    })
    return true
  })
}
