// src/services/follow.service.js
//
// Handles following and unfollowing a user. Same pattern as like.service.js:
// a composite doc ID (followerId_followingId) prevents following twice,
// and a transaction keeps the follow doc and both users' counters in sync.

import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { COLLECTIONS, followDocId } from "../lib/constants";

// Is followerId currently following followingId?
export async function isFollowing(followerId, followingId) {
  const ref = doc(db, COLLECTIONS.FOLLOWS, followDocId(followerId, followingId));
  const snap = await getDoc(ref);
  return snap.exists();
}

// Follow a user: writes the follow doc and bumps both counters together.
export async function followUser(followerId, followingId) {
  if (followerId === followingId) throw new Error("You can't follow yourself.");

  const followRef = doc(db, COLLECTIONS.FOLLOWS, followDocId(followerId, followingId));
  const followerRef = doc(db, COLLECTIONS.USERS, followerId);
  const followingRef = doc(db, COLLECTIONS.USERS, followingId);

  await runTransaction(db, async (transaction) => {
    // ALL reads first. Firestore transactions require this.
    const existing = await transaction.get(followRef);
    if (existing.exists()) return; // already following, nothing to do

    const followerSnap = await transaction.get(followerRef);
    const followingSnap = await transaction.get(followingRef);

    // Then all writes.
    transaction.set(followRef, {
      followerId,
      followingId,
      createdAt: serverTimestamp(),
    });
    transaction.update(followerRef, {
      followingCount: (followerSnap.data()?.followingCount || 0) + 1,
    });
    transaction.update(followingRef, {
      followerCount: (followingSnap.data()?.followerCount || 0) + 1,
    });
  });
}

// Unfollow a user: removes the follow doc and lowers both counters.
export async function unfollowUser(followerId, followingId) {
  const followRef = doc(db, COLLECTIONS.FOLLOWS, followDocId(followerId, followingId));
  const followerRef = doc(db, COLLECTIONS.USERS, followerId);
  const followingRef = doc(db, COLLECTIONS.USERS, followingId);

  await runTransaction(db, async (transaction) => {
    // ALL reads first.
    const existing = await transaction.get(followRef);
    if (!existing.exists()) return; // not following, nothing to do

    const followerSnap = await transaction.get(followerRef);
    const followingSnap = await transaction.get(followingRef);

    // Then all writes.
    transaction.delete(followRef);
    transaction.update(followerRef, {
      followingCount: Math.max((followerSnap.data()?.followingCount || 1) - 1, 0),
    });
    transaction.update(followingRef, {
      followerCount: Math.max((followingSnap.data()?.followerCount || 1) - 1, 0),
    });
  });
}