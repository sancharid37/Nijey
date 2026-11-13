// src/services/comment.service.js

import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Adds a comment to a journey, and bumps the journey's commentCount —
 * both done together in a transaction so they can't drift out of sync.
 */
export async function addComment({
  journeyId,
  authorId,
  authorUsername,
  authorPhotoURL,
  text,
}) {
  const journeyRef = doc(db, "journeys", journeyId);
  const commentRef = doc(collection(db, "comments"));

  await runTransaction(db, async (transaction) => {
    const journeySnap = await transaction.get(journeyRef);

    transaction.set(commentRef, {
      targetType: "journey",
      targetId: journeyId,
      journeyId,
      authorId,
      authorUsername,
      authorPhotoURL,
      text,
      parentCommentId: null,
      likeCount: 0,
      createdAt: serverTimestamp(),
      editedAt: null,
    });

    transaction.update(journeyRef, {
      commentCount: (journeySnap.data()?.commentCount || 0) + 1,
    });
  });

  return commentRef.id;
}

/**
 * Fetches all comments on a journey, oldest first.
 */
export async function getComments(journeyId) {
  const q = query(
    collection(db, "comments"),
    where("journeyId", "==", journeyId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
