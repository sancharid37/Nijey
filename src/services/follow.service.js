// src/services/follow.service.js

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, followDocId } from '../lib/constants';

// Check if followerId is following followingId
export const isFollowing = async (followerId, followingId) => {
  const ref = doc(db, COLLECTIONS.FOLLOWS, followDocId(followerId, followingId));
  const snap = await getDoc(ref);
  return snap.exists();
};

// Follow a user — writes the follow doc and bumps both counters atomically
export const followUser = async (followerId, followingId) => {
  if (followerId === followingId) throw new Error("You can't follow yourself");

  const followRef = doc(db, COLLECTIONS.FOLLOWS, followDocId(followerId, followingId));
  const followerRef = doc(db, COLLECTIONS.USERS, followerId);
  const followingRef = doc(db, COLLECTIONS.USERS, followingId);

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(followRef);
    if (existing.exists()) return; // already following, no-op

    const followerSnap = await transaction.get(followerRef);
    const followingSnap = await transaction.get(followingRef);

    transaction.set(followRef, {
      followId: followDocId(followerId, followingId),
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
};

// Unfollow a user — removes the doc and decrements both counters
export const unfollowUser = async (followerId, followingId) => {
  const followRef = doc(db, COLLECTIONS.FOLLOWS, followDocId(followerId, followingId));
  const followerRef = doc(db, COLLECTIONS.USERS, followerId);
  const followingRef = doc(db, COLLECTIONS.USERS, followingId);

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(followRef);
    if (!existing.exists()) return; // not following, no-op

    const followerSnap = await transaction.get(followerRef);
    const followingSnap = await transaction.get(followingRef);

    transaction.delete(followRef);

    transaction.update(followerRef, {
      followingCount: Math.max((followerSnap.data()?.followingCount || 1) - 1, 0),
    });
    transaction.update(followingRef, {
      followerCount: Math.max((followingSnap.data()?.followerCount || 1) - 1, 0),
    });
  });
};
