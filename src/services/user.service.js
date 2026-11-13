// src/services/user.service.js
//
// Handles username uniqueness. We keep a separate "usernames" collection
// where the DOCUMENT ID is the username itself (lowercased) — this lets us
// check "is this taken?" with a single, fast document read instead of a
// slower query across all users.

import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
// Only lowercase letters, numbers, and underscores, 3-20 characters.
// (Enforce lowercase in code too, so "Sanchari" and "sanchari" can't both exist.)
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function isValidUsernameFormat(username) {
  return USERNAME_REGEX.test(username);
}

// Quick check — does NOT reserve it, just tells you if it's free right now.
// Note: someone else could still grab it between this check and submitting,
// which is exactly why claimUsername() below re-checks inside a transaction.
export async function isUsernameAvailable(username) {
  const ref = doc(db, "usernames", username);
  const snap = await getDoc(ref);
  return !snap.exists();
}

/**
 * Atomically claims a username for a user:
 * - creates usernames/{username} -> { uid }
 * - sets users/{uid}.username = username
 * Both happen together, or neither happens, thanks to the transaction.
 * Throws an error if the username is already taken.
 */
export async function claimUsername(uid, username) {
  const usernameRef = doc(db, "usernames", username);
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (transaction) => {
    const usernameSnap = await transaction.get(usernameRef);

    if (usernameSnap.exists()) {
      throw new Error("That username is already taken.");
    }

    transaction.set(usernameRef, { uid });
    transaction.update(userRef, { username });
  });
}

/**
 * Looks up a full user profile by their username (not their uid).
 * Two-step lookup: usernames/{username} -> { uid }, then users/{uid} -> full profile.
 * Returns null if the username doesn't exist.
 */
export async function getUserByUsername(username) {
  const usernameSnap = await getDoc(doc(db, "usernames", username));
  if (!usernameSnap.exists()) return null;

  const { uid } = usernameSnap.data();
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return null;

  return { id: userSnap.id, ...userSnap.data() };
}
