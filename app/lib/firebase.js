"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBknGACfthTV7XlSdNw8X5azEw61sHyHDw",
  authDomain: "yads-b6254.firebaseapp.com",
  projectId: "yads-b6254",
  storageBucket: "yads-b6254.firebasestorage.app",
  messagingSenderId: "793719245640",
  appId: "1:793719245640:web:a6d1ae02dd661e7fec017d",
  measurementId: "G-1DPC941KLJ",
};

// ✅ Prevent multiple initialization (Next.js fix)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Firebase Services Export
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Analytics (only browser me chalega)
let analytics = null;

if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };
