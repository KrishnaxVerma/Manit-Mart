import { deleteField, doc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'

// Older app versions stored OTPs on products and marked them RESERVED.
// Remove those legacy fields so the listing returns to the non-exclusive flow.
export async function clearLegacyReservation(productId) {
  const productRef = doc(db, 'products', productId)
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(productRef)
    if (!snapshot.exists() || snapshot.data().status !== 'RESERVED') return false

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
