// Fix: Use Firebase v9 compat libraries to support v8 syntax with v9+ SDK.
// FIX: Use compat imports for Firebase v8 syntax.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6W-KiB2ss1WKI5isypFTgHE-N5JPzRWA",
  authDomain: "synca-viet-nam.firebaseapp.com",
  projectId: "synca-viet-nam",
  storageBucket: "synca-viet-nam.appspot.com",
  messagingSenderId: "801354200896",
  appId: "1:801354200896:web:3b2a84beaccfcc71db6ca5",
  measurementId: "G-HM1N09JBQH"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Enable offline persistence to handle transient network issues more gracefully.
try {
  db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled
            // in one tab at a time.
            console.warn('Firestore persistence failed: multiple tabs open.');
        } else if (err.code === 'unimplemented') {
            // The current browser does not support all of the
            // features required to enable persistence
            console.warn('Firestore persistence not supported in this browser.');
        }
    });
} catch (error) {
    console.error("Error enabling Firestore persistence", error);
}


// Get Firebase services
const auth = firebase.auth();
const storage = firebase.storage();

export { auth, db, firebase, storage };