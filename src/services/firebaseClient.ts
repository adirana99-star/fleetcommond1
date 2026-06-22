import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebaseConfig';

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

export const auth = getAuth();
export const db = getFirestore();

export default app;
