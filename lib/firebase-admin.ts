import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '../config';

const firebaseAdminConfig = {
  credential: cert({
    projectId: firebaseConfig.admin.projectId,
    clientEmail: firebaseConfig.admin.clientEmail,
    privateKey: firebaseConfig.admin.privateKey,
  }),
};

// Initialize Firebase Admin
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const adminDb = getFirestore(app);

export { adminDb }; 