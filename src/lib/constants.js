// src/lib/constants.js
//
// One home for names we use in many places, so a typo can't
// sneak in and point two files at two different collections.

export const COLLECTIONS = {
  USERS: "users",
  USERNAMES: "usernames",
  JOURNEYS: "journeys",
  JOURNEY_UPDATES: "journeyUpdates",
  COMMENTS: "comments",
  LIKES: "likes",
  FOLLOWS: "follows",
};

// A follow is stored under a doc ID built from both people's IDs.
// Because the ID is always "followerId_followingId", the same person
// can never follow the same account twice: the second attempt would
// land on the same document instead of creating a duplicate.
export function followDocId(followerId, followingId) {
  return `${followerId}_${followingId}`;
}