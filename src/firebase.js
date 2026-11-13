// src/firebase.js
//
// This file does ONE job: connect our app to our Firebase project,
// and export the pieces of Firebase we'll use elsewhere (auth, database, storage).
// Every other file that needs Firebase will import FROM this file,
// instead of setting up its own connection.

import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// These values come from your .env file (see VITE_FIREBASE_* variables).
// import.meta.env is Vite's way of reading environment variables in the browser.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// This creates the actual connection to your Firebase project.
const app = initializeApp(firebaseConfig);

// getAuth() gives us the piece of Firebase that handles login/signup/logout.
export const auth = getAuth(app);

// Explicitly set persistence to "local" — this means the login session
// survives page refreshes AND full browser restarts. We set this explicitly
// (instead of relying on Firebase's default) because some browsers,
// especially Firefox with strict privacy settings, can behave inconsistently
// with Firebase's default persistence detection.
setPersistence(auth, browserLocalPersistence);

// getFirestore() gives us the piece of Firebase that handles our database
// (this is where users, journeys, etc. will live, as collections of documents).
export const db = getFirestore(app);

// We export `app` too, in case a future feature needs it directly
// (e.g. Firebase Storage, or Analytics).
export default app;