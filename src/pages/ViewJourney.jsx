// src/pages/ViewJourney.jsx
//
// Shows a single Journey: title, cover image, author, description,
// timeline of updates, plus Like, Comment, and Share actions.

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getJourney, getJourneyUpdates } from "../services/journey.service.js";
import { hasLiked, likeJourney, unlikeJourney } from "../services/like.service.js";
import { addComment, getComments } from "../services/comment.service.js";
import { useAuth } from "../context/AuthContext.jsx";

function ViewJourney() {
  const { journeyId } = useParams();
  const { user, userProfile } = useAuth();

  const [journey, setJourney] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const journeyData = await getJourney(journeyId);
        if (!journeyData) {
          setError("This journey doesn't exist or was removed.");
          setLoading(false);
          return;
        }
        setJourney(journeyData);
        setLikeCount(journeyData.likeCount || 0);

        const updatesData = await getJourneyUpdates(journeyId);
        setUpdates(updatesData);

        const commentsData = await getComments(journeyId);
        setComments(commentsData);

        if (user) {
          const likedAlready = await hasLiked(user.uid, journeyId);
          setLiked(likedAlready);
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading this journey.");
      }
      setLoading(false);
    }

    load();
  }, [journeyId, user]);

  const handleToggleLike = async () => {
    console.log("LIKE CLICKED. user:", user?.uid, "journeyId:", journeyId, "wasLiked:", liked);
    if (!user || likeBusy) {
      console.log("BLOCKED: user missing or already busy");
      return;
    }
    setLikeBusy(true);

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      if (wasLiked) {
        await unlikeJourney(user.uid, journeyId);
        console.log("UNLIKE SUCCESS");
      } else {
        await likeJourney(user.uid, journeyId);
        console.log("LIKE SUCCESS");
      }
    } catch (err) {
      console.log("LIKE ERROR:", err);
      setLiked(wasLiked);
      setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    }

    setLikeBusy(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setCommentSubmitting(true);
    try {
      const newCommentId = await addComment({
        journeyId,
        authorId: user.uid,
        authorUsername: userProfile?.username || "",
        authorPhotoURL: userProfile?.photoURL || "",
        text: commentText.trim(),
      });

      setComments((prev) => [
        ...prev,
        {
          id: newCommentId,
          authorUsername: userProfile?.username || "",
          authorPhotoURL: userProfile?.photoURL || "",
          text: commentText.trim(),
        },
      ]);
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
    setCommentSubmitting(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Couldn't copy link", err);
    }
  };

  if (loading) {
    return <div style={styles.container}><p style={styles.muted}>Loading...</p></div>;
  }
  if (error) {
    return <div style={styles.container}><p style={styles.error}>{error}</p></div>;
  }

  const isOwner = user && user.uid === journey.authorId;

  return (
    <div style={styles.container}>
      {journey.coverImageURL && (
        <img src={journey.coverImageURL} alt={journey.title} style={styles.cover} />
      )}

      <div style={styles.authorRow}>
        {journey.authorPhotoURL && (
          <img src={journey.authorPhotoURL} alt={journey.authorUsername} style={styles.authorAvatar} />
        )}
        <Link to={`/${journey.authorUsername}`} style={styles.authorName}>
          {journey.authorUsername}
        </Link>
        <span style={styles.discipline}>{journey.discipline}</span>
      </div>

      <h1 style={styles.title}>{journey.title}</h1>
      {journey.description && <p style={styles.description}>{journey.description}</p>}

      <div style={styles.actionBar}>
        <button
          onClick={handleToggleLike}
          disabled={!user || likeBusy}
          style={{
            ...styles.actionButton,
            ...styles.likeButton,
            backgroundColor: liked ? "#FFF0F5" : "transparent",
            transform: liked ? "scale(1.05)" : "scale(1)",
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>🫰</span> {likeCount}
        </button>
        <span style={styles.actionButton}>💬 {comments.length}</span>
        <button onClick={handleShare} style={styles.actionButton}>
          ↗ {shareCopied ? "Link copied!" : "Share"}
        </button>
      </div>

      {isOwner && (
        <Link to={`/journey/${journey.id}/continue`} style={styles.continueButton}>
          + Add an update
        </Link>
      )}

      <div style={styles.timeline}>
        {updates.length === 0 ? (
          <p style={styles.muted}>No updates yet. This journey is just getting started.</p>
        ) : (
          updates.map((update) => (
            <div key={update.id} style={styles.updateCard}>
              {update.mediaURL && (
                <img src={update.mediaURL} alt={update.caption} style={styles.updateImg} />
              )}
              {update.caption && <p style={styles.updateCaption}>{update.caption}</p>}
            </div>
          ))
        )}
      </div>

      <div style={styles.commentsSection}>
        <h2 style={styles.sectionHeading}>Comments</h2>

        {user ? (
          <form onSubmit={handleAddComment} style={styles.commentForm}>
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={styles.commentInput}
            />
            <button type="submit" disabled={commentSubmitting || !commentText.trim()} style={styles.commentButton}>
              Post
            </button>
          </form>
        ) : (
          <p style={styles.muted}><Link to="/login">Log in</Link> to leave a comment.</p>
        )}

        {comments.length === 0 ? (
          <p style={styles.muted}>No comments yet.</p>
        ) : (
          <div style={styles.commentList}>
            {comments.map((comment) => (
              <div key={comment.id} style={styles.commentItem}>
                {comment.authorPhotoURL && (
                  <img src={comment.authorPhotoURL} alt="" style={styles.commentAvatar} />
                )}
                <div>
                  <Link to={`/${comment.authorUsername}`} style={styles.commentAuthor}>
                    {comment.authorUsername}
                  </Link>
                  <p style={styles.commentText}>{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: "640px", margin: "2rem auto", padding: "0 1.5rem 4rem", fontFamily: "Inter, sans-serif" },
  cover: { width: "100%", maxHeight: "360px", objectFit: "cover", borderRadius: "12px", marginBottom: "1rem" },
  authorRow: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" },
  authorAvatar: { width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" },
  authorName: { fontWeight: 600, color: "#111111", fontSize: "0.9rem", textDecoration: "none" },
  discipline: {
    fontSize: "0.75rem", color: "#666666", border: "1px solid #ECECEC",
    borderRadius: "100px", padding: "0.15rem 0.6rem", marginLeft: "0.25rem",
  },
  title: { color: "#111111", margin: "0.5rem 0" },
  description: { color: "#666666", lineHeight: 1.6, marginBottom: "1rem" },
  actionBar: {
    display: "flex", gap: "1.25rem", alignItems: "center",
    borderTop: "1px solid #ECECEC", borderBottom: "1px solid #ECECEC",
    padding: "0.75rem 0", marginBottom: "1.5rem",
  },
  actionButton: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "0.9rem", color: "#111111", display: "flex", alignItems: "center", gap: "0.3rem",
    padding: 0, fontFamily: "inherit",
  },
  likeButton: {
    padding: "0.3rem 0.6rem",
    borderRadius: "100px",
    transition: "background-color 0.15s, transform 0.15s",
  },
  continueButton: {
    display: "inline-block", padding: "0.6rem 1.2rem", backgroundColor: "#000000",
    color: "#FFFFFF", borderRadius: "6px", textDecoration: "none", fontSize: "0.9rem",
    marginBottom: "2rem",
  },
  timeline: { display: "flex", flexDirection: "column", gap: "1.5rem", paddingTop: "0.5rem" },
  updateCard: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  updateImg: { width: "100%", borderRadius: "8px", objectFit: "cover" },
  updateCaption: { color: "#111111", lineHeight: 1.5 },
  muted: { color: "#666666" },
  error: { color: "#B00020" },
  commentsSection: { borderTop: "1px solid #ECECEC", marginTop: "2rem", paddingTop: "1.5rem" },
  sectionHeading: { color: "#111111", marginBottom: "1rem" },
  commentForm: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem" },
  commentInput: {
    flex: 1, padding: "0.6rem", border: "1px solid #ECECEC", borderRadius: "6px",
    fontSize: "0.9rem", fontFamily: "inherit",
  },
  commentButton: {
    padding: "0.6rem 1.2rem", backgroundColor: "#000000", color: "#FFFFFF",
    border: "none", borderRadius: "6px", fontSize: "0.9rem", cursor: "pointer",
  },
  commentList: { display: "flex", flexDirection: "column", gap: "1rem" },
  commentItem: { display: "flex", gap: "0.6rem" },
  commentAvatar: { width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  commentAuthor: { fontWeight: 600, color: "#111111", fontSize: "0.85rem", textDecoration: "none" },
  commentText: { color: "#111111", fontSize: "0.9rem", margin: "0.2rem 0 0", lineHeight: 1.4 },
};

export default ViewJourney;
