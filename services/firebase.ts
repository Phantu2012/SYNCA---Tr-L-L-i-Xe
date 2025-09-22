import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// A fallback for when environment variables are not set, to prevent crashes.
// In a real production app, you would have a more robust configuration system.
const safeFirebaseConfig = {
    apiKey: firebaseConfig.apiKey || "mock-key",
    authDomain: firebaseConfig.authDomain || "mock.firebaseapp.com",
    projectId: firebaseConfig.projectId || "mock-project",
    storageBucket: firebaseConfig.storageBucket || "mock.appspot.com",
    messagingSenderId: firebaseConfig.messagingSenderId || "12345",
    appId: firebaseConfig.appId || "mock-app-id",
};


// Initialize Firebase
const app = initializeApp(safeFirebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };