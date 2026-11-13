// src/services/like.service.js
//
// Handles liking/unliking a journey. Same pattern as follow.service.js:
// a composite doc ID (userId_journeyId) prevents someone liking twice,
// and a transaction keeps the like doc + the journey's likeCount in sync.

import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";

const likeDocId = (userId, journeyId) => `${userId}_${journeyId}`;

export async function hasLiked(userId, journeyId) {
  const ref = doc(db, "likes", likeDocId(userId, journeyId));
  const snap = await getDoc(ref);
  return snap.exists();
}

export async function likeJourney(userId, journeyId) {
  const likeRef = doc(db, "likes", likeDocId(userId, journeyId));
  const journeyRef = doc(db, "journeys", journeyId);

  await runTransaction(db, async (transaction) => {
    // ALL reads first — Firestore transactions require this.
    const existing = await transaction.get(likeRef);
    if (existing.exists()) return; // already liked, no-op

    const journeySnap = await transaction.get(journeyRef);

    // Then all writes.
    transaction.set(likeRef, { userId, journeyId });
    transaction.update(journeyRef, {
      likeCount: (journeySnap.data()?.likeCount || 0) + 1,
    });
  });
}

export async function unlikeJourney(userId, journeyId) {
  const likeRef = doc(db, "likes", likeDocId(userId, journeyId));
  const journeyRef = doc(db, "journeys", journeyId);

  await runTransaction(db, async (transaction) => {
    // ALL reads first.
    const existing = await transaction.get(likeRef);
    if (!existing.exists()) return; // not liked, no-op

    const journeySnap = await transaction.get(journeyRef);

    // Then all writes.
    transaction.delete(likeRef);
    transaction.update(journeyRef, {
      likeCount: Math.max((journeySnap.data()?.likeCount || 1) - 1, 0),
    });
  });
}
