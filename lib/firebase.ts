import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables for server-side
if (typeof window === 'undefined') {
  config({ path: '.env.local' });
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAghYA_AmSa21gCmljESGJaavBeC7AQkgE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "the-gs-9261e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "the-gs-9261e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "the-gs-9261e.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "311845393220",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:311845393220:web:070563dc5ae93aae5bbd11",
};

// Initialize Firebase Client SDK (for client-side use)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Firebase Admin SDK (for server-side use)
let adminDb: admin.firestore.Firestore | null = null;
let adminApp: admin.app.App | null = null;
let useAdminSDK = false;

if (typeof window === 'undefined') {
  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      console.log('GOOGLE_SERVICE_ACCOUNT_KEY found, initializing Admin SDK...');
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountKey, "base64").toString("utf8")
      );
      
      if (!admin.apps.length) {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket,
        });
      } else {
        adminApp = admin.apps[0]!;
      }
      
      adminDb = admin.firestore();
      useAdminSDK = true;
      console.log('Firebase Admin SDK initialized successfully');
    } else {
      console.warn('No GOOGLE_SERVICE_ACCOUNT_KEY provided, using client SDK for server operations');
      useAdminSDK = false;
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    useAdminSDK = false;
  }
}

export { app, db, auth, adminDb, adminApp, useAdminSDK };
