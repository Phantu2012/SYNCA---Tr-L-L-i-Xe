// FIX: Update to v8 compat imports
// Fix: Use v8 compatibility layer by importing firebase/compat/*
// FIX: The compat library should be imported as the default export, not as a namespace.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6W-KiB2ss1WKI5isypFTgHE-N5JPzRWA",
  authDomain: "synca-viet-nam.firebaseapp.com",
  projectId: "synca-viet-nam",
  storageBucket: "synca-viet-nam.firebasestorage.app",
  messagingSenderId: "801354200896",
  appId: "1:801354200896:web:3b2a84beaccfcc71db6ca5",
  measurementId: "G-HM1N09JBQH"
};

// Initialize Firebase
// FIX: Use v8 compat initialization
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Firebase services
// FIX: Use v8 compat service getters
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };
