// Fix: Use Firebase v9 compat libraries to support v8 syntax with v9+ SDK.
// FIX: Use compat imports for Firebase v8 syntax.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

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

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db, firebase };
