/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase Configuration — UCA Connect
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses NEXT_PUBLIC_FIREBASE_* environment variables for Vercel deployment.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCpN7llAyszgXsYI1m1uJUVEt6un3FFJb4",
  authDomain: "uca-connect-ccd38.firebaseapp.com",
  databaseURL: "https://uca-connect-ccd38-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "uca-connect-ccd38",
  storageBucket: "uca-connect-ccd38.firebasestorage.app",
  messagingSenderId: "229944769659",
  appId: "1:229944769659:web:2527e74dd126c0da4176de",
  measurementId: "G-57Q9WRNE0P"
};


// Prevent re-initialising the app on hot-reload in Next.js dev mode
const app = getApps()?.length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
