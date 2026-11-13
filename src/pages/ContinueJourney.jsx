// src/pages/ContinueJourney.jsx
//
// Adds a new update (milestone) to an existing journey.
// This is the "Continue Journey" action — the core repeated loop of the app.

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { uploadImage } from "../services/cloudinary.service.js";
import { getJourney, addJourneyUpdate } from "../services/journey.service.js";

function ContinueJourney() {
  const { journeyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [journey, setJourney] = useState(null);
  const [loadingJourney, setLoadingJourney] = useState(true);

  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load the journey first, so we know its current updateCount (needed for
  // "order") and can confirm the logged-in user actually owns this journey.
  useEffect(() => {
    async function load() {
      setLoadingJourney(true);
      const data = await getJourney(journeyId);
      setJourney(data);
      setLoadingJourney(false);
    }
    load();
  }, [journeyId]);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!mediaFile && !caption.trim()) {
      setError("Add a photo or a caption — at least one.");
      return;
    }

    setSubmitting(true);

    try {
      let mediaURL = "";
      if (mediaFile) {
        mediaURL = await uploadImage(mediaFile);
      }

      await addJourneyUpdate({
        journeyId: journey.id,
        authorId: user.uid,
        authorUsername: journey.authorUsername,
        authorPhotoURL: journey.authorPhotoURL,
        journeyTitle: journey.title,
        caption: caption.trim(),
        mediaURL,
        mediaType: mediaFile ? "image" : "text",
        currentUpdateCount: journey.updateCount,
      });

      navigate(`/journey/${journey.id}`);
    } catch (err) {
      setError(err.message);
    }

    setSubmitting(false);
  };

  if (loadingJourney) {
    return <div style={styles.container}><p style={styles.muted}>Loading...</p></div>;
  }

  if (!journey) {
    return <div style={styles.container}><p style={styles.error}>Journey not found.</p></div>;
  }

  // Ownership check — even though Firestore rules are the REAL security
  // layer, this gives a clean message instead of a confusing failed write.
  if (user.uid !== journey.authorId) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>You can only add updates to your own journeys.</p>
        <Link to={`/journey/${journey.id}`}>Back to journey</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <p style={styles.breadcrumb}>
        <Link to={`/journey/${journey.id}`} style={styles.breadcrumbLink}>{journey.title}</Link>
      </p>
      <h1 style={styles.heading}>Add an update</h1>
      <p style={styles.subtext}>Share the next step in this journey.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.mediaBox}>
          {mediaPreview ? (
            <img src={mediaPreview} alt="Preview" style={styles.mediaPreview} />
          ) : (
            <label style={styles.mediaLabel}>
              + Add a photo
              <input type="file" accept="image/*" onChange={handleMediaChange} style={{ display: "none" }} />
            </label>
          )}
        </div>

        <textarea
          placeholder="What's new? (caption, progress notes, thoughts...)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? "Posting..." : "Post update"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: "480px", margin: "4rem auto", padding: "0 1.5rem", fontFamily: "Inter, sans-serif" },
  breadcrumb: { marginBottom: "0.25rem" },
  breadcrumbLink: { color: "#666666", fontSize: "0.85rem", textDecoration: "none" },
  heading: { color: "#111111", marginBottom: "0.25rem" },
  subtext: { color: "#666666", marginBottom: "1.5rem", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  input: {
    padding: "0.75rem", border: "1px solid #ECECEC", borderRadius: "6px",
    fontSize: "1rem", fontFamily: "inherit", width: "100%", boxSizing: "border-box",
    resize: "vertical",
  },
  button: {
    padding: "0.75rem", backgroundColor: "#000000", color: "#FFFFFF",
    border: "none", borderRadius: "6px", fontSize: "1rem", cursor: "pointer",
  },
  error: { color: "#B00020", fontSize: "0.875rem" },
  muted: { color: "#666666" },
  mediaBox: {
    width: "100%", minHeight: "200px", border: "1px dashed #ECECEC", borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    backgroundColor: "#F7F7F7",
  },
  mediaLabel: { color: "#666666", fontSize: "0.9rem", cursor: "pointer" },
  mediaPreview: { width: "100%", maxHeight: "320px", objectFit: "cover" },
};

export default ContinueJourney;
