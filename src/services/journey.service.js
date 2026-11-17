// src/services/journey.service.js

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Fetches a single journey by its id.
 * Returns null if it doesn't exist, so pages can show a "not found" state.
 */
export async function getJourney(journeyId) {
  const snap = await getDoc(doc(db, "journeys", journeyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Fetches all updates belonging to a journey, oldest first —
 * this is what renders as the timeline. Empty array if none exist yet.
 */
export async function getJourneyUpdates(journeyId) {
  const q = query(
    collection(db, "journeyUpdates"),
    where("journeyId", "==", journeyId),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetches recent public journeys for the Discover feed, most recently
 * ACTIVE first (updatedAt, not createdAt) — a journey that just got a new
 * update bumps back to the top, keeping the feed feeling alive.
 */
export async function getRecentJourneys(pageLimit = 20) {
  const q = query(
    collection(db, "journeys"),
    where("visibility", "==", "public"),
    orderBy("updatedAt", "desc"),
    limit(pageLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetches all public journeys by a specific author, most recent first —
 * used on their profile page.
 */
export async function getUserJourneys(authorId) {
  const q = query(
    collection(db, "journeys"),
    where("authorId", "==", authorId),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Searches public journeys. Firestore has no real full-text search, so we
 * load the most recent public journeys and filter them in the browser.
 * Every word you type must appear somewhere in the title, description or
 * art form, in any upper/lower case. This is fine for a few hundred
 * journeys; past that, a search service (like Algolia) is the next step.
 */
export async function searchJourneysByTitle(searchText) {
  const words = searchText.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const q = query(
    collection(db, "journeys"),
    where("visibility", "==", "public"),
    orderBy("updatedAt", "desc"),
    limit(200)
  );
  const snap = await getDocs(q);

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((journey) => {
      const haystack = [journey.title, journey.description, journey.discipline]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return words.every((word) => haystack.includes(word));
    })
    .slice(0, 20);
}

/**
 * Adds a new update to a journey. Does TWO things atomically (via transaction):
 * 1. Creates the journeyUpdates document
 * 2. Bumps the parent journey's updateCount +1 and refreshes its updatedAt
 *    (this is what makes the journey jump back to the top of Discover —
 *    "recently active" — when someone adds a new update)
 */
export async function addJourneyUpdate({
  journeyId,
  authorId,
  authorUsername,
  authorPhotoURL,
  journeyTitle,
  caption,
  mediaURL,
  mediaType,
  currentUpdateCount, // passed in so we know what "order" this new update is
}) {
  const journeyRef = doc(db, "journeys", journeyId);
  // We create the update doc reference ourselves (instead of letting addDoc
  // generate one) so we can include it inside the transaction.
  const updateRef = doc(collection(db, "journeyUpdates"));

  await runTransaction(db, async (transaction) => {
    transaction.set(updateRef, {
      journeyId,
      authorId,
      authorUsername,
      authorPhotoURL,
      journeyTitle,
      caption,
      mediaURL,
      mediaType,
      order: currentUpdateCount, // 0 for the first update, 1 for the second, etc.
      commentCount: 0,
      likeCount: 0,
      createdAt: serverTimestamp(),
    });

    transaction.update(journeyRef, {
      updateCount: currentUpdateCount + 1,
      updatedAt: serverTimestamp(),
    });
  });

  return updateRef.id;
}

/**
 * Creates a new Journey document.
 * Looks up the author's profile first, so we can store their username/photo
 * directly on the journey doc (denormalization — avoids extra reads later
 * when rendering feed cards).
 */
export async function createJourney({
  authorId,
  title,
  description,
  discipline,
  coverImageURL = "",
}) {
  // Look up the author's Firestore profile (not just their Firebase Auth info)
  // so we can copy their current username/photo onto this journey.
  const userSnap = await getDoc(doc(db, "users", authorId));

  if (!userSnap.exists()) {
    throw new Error("User profile not found. Please complete your profile first.");
  }

  const userData = userSnap.data();

  const journeyRef = await addDoc(collection(db, "journeys"), {
    authorId,
    authorUsername: userData.username || "",
    authorPhotoURL: userData.photoURL || "",
    title,
    titleLower: title.toLowerCase(),
    description,
    discipline,
    coverImageURL,
    status: "active",
    updateCount: 0,
    commentCount: 0,
    likeCount: 0,
    visibility: "public",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return journeyRef.id;
}