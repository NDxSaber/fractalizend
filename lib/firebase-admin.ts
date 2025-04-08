import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('Missing FIREBASE_PRIVATE_KEY environment variable');
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error('Missing FIREBASE_CLIENT_EMAIL environment variable');
}

if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable');
}

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key needs to be properly formatted
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
};

// Initialize Firebase Admin
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const adminDb = getFirestore(app);

export { adminDb }; 