// Firebase setup.
//
// 1. Go to https://console.firebase.google.com
// 2. Create a project (any name, e.g. "nijey-gallery")
// 3. In the project, click the </> (Web) icon under "Add an app"
// 4. Firebase will show you a config object like the one below —
//    copy YOUR values in here, replacing the placeholders.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDRHta0sU2JSkMC1vXFIEcDr4ZXTrNEs-s",
  authDomain: "nijey-gallery.firebaseapp.com",
  projectId: "nijey-gallery",
  storageBucket: "nijey-gallery.firebasestorage.app",
  messagingSenderId: "120788207496",
  appId: "1:120788207496:web:63a7ed952a5941aeb51c3d",
  measurementId: "G-G0RV5MYGVP"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
