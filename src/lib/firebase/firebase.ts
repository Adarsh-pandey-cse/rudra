import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

import { browserLocalPersistence, setPersistence } from "firebase/auth";
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);
const storage = getStorage(app);

// Initialize Firestore with offline persistence enabled
const db = !getApps().length
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    })
  : getFirestore(app);

export { app, auth, db, storage };

// Initialize Messaging safely (only runs on client side where supported)
export const getFCMToken = async () => {
  try {
    if (typeof window !== "undefined" && await isSupported()) {
      const messaging = getMessaging(app);
      const { getToken } = await import("firebase/messaging");
      
      const swUrl = `/firebase-messaging-sw.js?apiKey=${firebaseConfig.apiKey}&authDomain=${firebaseConfig.authDomain}&projectId=${firebaseConfig.projectId}&storageBucket=${firebaseConfig.storageBucket}&messagingSenderId=${firebaseConfig.messagingSenderId}&appId=${firebaseConfig.appId}`;
      const registration = await navigator.serviceWorker.register(swUrl);
      
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      return token;
    }
  } catch (error: any) {
    console.error("An error occurred while retrieving token. ", error);
    if (typeof window !== "undefined") {
       import("sonner").then(({ toast }) => {
         toast.error("FCM Token Error", {
           description: error.message || "Failed to generate device token.",
           duration: 8000
         });
       });
    }
  }
  return null;
};
