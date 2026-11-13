// src/context/AuthContext.jsx
//
// Tracks TWO things now:
// 1. `user` — the Firebase Auth user (email, uid) — same as before
// 2. `userProfile` — the matching Firestore document (username, displayName,
//    photoURL, bio, discipline) — NEW. This is what pages like NavBar need
//    to show a username instead of an email.

import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This runs whenever login state changes (login, logout, page refresh).
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("AUTH STATE CHANGED:", firebaseUser ? `logged in as ${firebaseUser.email}` : "no user (logged out)");
      setUser(firebaseUser);

      if (!firebaseUser) {
        // Logged out — clear the profile too, nothing to watch.
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // Logged in — start LISTENING to their Firestore profile doc.
      // onSnapshot (unlike getDoc) keeps updating automatically whenever
      // the document changes — e.g. if they update their profile picture
      // on CompleteProfile, NavBar will reflect it immediately, no refresh needed.
      const unsubscribeProfile = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (docSnap) => {
          setUserProfile(docSnap.exists() ? docSnap.data() : null);
          setLoading(false);
        }
      );

      // Store this inner unsubscribe so we can clean it up if the user logs out.
      return unsubscribeProfile;
    });

    return unsubscribeAuth;
  }, []);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    userProfile,
    loading,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
