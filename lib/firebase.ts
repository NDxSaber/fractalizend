import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig.client) : getApps()[0];
const db = getFirestore(app);

console.log('Firebase initialized successfully');

export { db }; 