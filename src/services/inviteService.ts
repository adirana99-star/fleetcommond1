import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseClient';

function genCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createInviteForVendor(vendorId: string, vendorEmail: string) {
  const code = genCode(8);
  const ref = doc(collection(db, 'vendorInvites'), code);
  await setDoc(ref, {
    vendorId,
    vendorEmail: vendorEmail || null,
    code,
    createdAt: serverTimestamp(),
    claimed: false
  });
  return code;
}

export async function verifyInviteCode(code: string) {
  const ref = doc(db, 'vendorInvites', code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.claimed) return null;
  return { vendorId: data.vendorId, vendorEmail: data.vendorEmail };
}
