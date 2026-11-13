// src/pages/CreateJourney.jsx
//
// The "Start a Journey" form — this is Nijey's core action, replacing
// the generic "Upload" concept from most creative platforms.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { uploadImage } from "../services/cloudinary.service.js";
import { createJourney } from "../services/journey.service.js";

// Art forms / mediums — what KIND of creative work this journey is,
// not what profession the person has (that's a separate concept, used
// on the profile page instead).
const JOURNEY_TYPES = [
  "Painting",
  "Drawing / Illustration",
  "Sculpture",
  "Photography",
  "Digital Art",
  "Animation",
  "Comic / Graphic Novel",
  "Tattoo Design",

  "Music",
  "Songwriting",
  "Music Production",

  "Writing",
  "Poetry",
  "Screenwriting",

  "Filmmaking",
  "Acting / Performance",
  "Dance",
  "Podcast",
  "Voice Work",

  "Fashion Design",
  "Jewelry Making",
  "Textile / Craft",
  "Ceramics",
  "Woodworking",

  "Architecture",
  "Interior Design",
  "UI/UX Design",
  "Game Art",

  "Video Content",
  "Other",
];

function CreateJourney() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Give your journey a title.");
      return;
    }
    if (!discipline) {
      setError("Select what kind of journey this is.");
      return;
    }

    setSubmitting(true);

    try {
      let coverImageURL = "";
      if (coverFile) {
        coverImageURL = await uploadImage(coverFile);
      }

      const journeyId = await createJourney({
        authorId: user.uid,
        title: title.trim(),
        description: description.trim(),
        discipline,
        coverImageURL,
      });

      navigate(`/journey/${journeyId}`);
    } catch (err) {
      setError(err.message);
    }

    setSubmitting(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Start a Journey</h1>
      <p style={styles.subtext}>
        Every great piece starts somewhere. This is that starting point.
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.coverRow}>
          <div style={styles.coverPreviewBox}>
            {coverPreview ? (
              <img src={coverPreview} alt="Cover preview" style={styles.coverImg} />
            ) : (
              <span style={styles.coverPlaceholder}>Cover image</span>
            )}
          </div>
          <label style={styles.uploadLabel}>
            Choose cover image
            <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
          </label>
        </div>

        <input
          type="text"
          placeholder="Journey title (e.g. 'Learning oil painting')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={styles.input}
        />

        <select
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          required
          style={styles.input}
        >
          <option value="">What kind of journey is this?</option>
          {JOURNEY_TYPES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <textarea
          placeholder="What are you working towards? (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ ...styles.input, resize: "vertical" }}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? "Creating..." : "Start Journey"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: "480px", margin: "4rem auto", padding: "2rem", fontFamily: "Inter, sans-serif" },
  heading: { color: "#111111", marginBottom: "0.25rem" },
  subtext: { color: "#666666", marginBottom: "1.5rem", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  input: {
    padding: "0.75rem", border: "1px solid #ECECEC", borderRadius: "6px",
    fontSize: "1rem", fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  },
  button: {
    padding: "0.75rem", backgroundColor: "#000000", color: "#FFFFFF",
    border: "none", borderRadius: "6px", fontSize: "1rem", cursor: "pointer",
  },
  error: { color: "#B00020", fontSize: "0.875rem" },
  coverRow: { display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "0.5rem" },
  coverPreviewBox: {
    width: "100%", height: "160px", borderRadius: "8px", border: "1px solid #ECECEC",
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
    backgroundColor: "#F7F7F7",
  },
  coverImg: { width: "100%", height: "100%", objectFit: "cover" },
  coverPlaceholder: { fontSize: "0.85rem", color: "#666666" },
  uploadLabel: {
    fontSize: "0.9rem", color: "#111111", border: "1px solid #ECECEC",
    padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer",
    textAlign: "center", alignSelf: "flex-start",
  },
};

export default CreateJourney;
