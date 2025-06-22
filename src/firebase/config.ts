import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // added import for Firestore
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCSMwogfsqwcd6IR51gxlLgRy-r8OTQNzk",
  authDomain: "general-restriction.firebaseapp.com",
  projectId: "general-restriction",
  storageBucket: "general-restriction.firebasestorage.app", // تم تصحيح القيمة لتطابق التكوين الأصلي
  messagingSenderId: "173811326971",
  appId: "1:173811326971:web:0185d170c4d50947f0355e",
  measurementId: "G-VBEMHD50NK"
};

// تهيئة Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// تهيئة Auth
const auth = getAuth(app);

// تهيئة Analytics عند استخدام المتصفح فقط
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error("Analytics initialization error:", error);
  }
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, analytics, db, storage };