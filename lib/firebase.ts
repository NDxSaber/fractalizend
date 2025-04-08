import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAOgPEXaC97rAri5BrkZ8I9CLxbrZrdLu8",
  authDomain: "fractalizend-screener.firebaseapp.com",
  projectId: "fractalizend-screener",
  storageBucket: "fractalizend-screener.firebasestorage.app",
  messagingSenderId: "1023573792880",
  appId: "1:1023573792880:web:a44d486723548dc9247cb5"
};

console.log('Initializing Firebase with config:', firebaseConfig);

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

console.log('Firebase initialized successfully');

export { app, db }; 