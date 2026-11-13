// src/pages/CompleteProfile.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";
import { uploadImage } from "../services/cloudinary.service.js";
import {
  isValidUsernameFormat,
  isUsernameAvailable,
  claimUsername,
} from "../services/user.service.js";

const DISCIPLINES = [
  "Artist", "Painter", "Illustrator", "Sculptor", "Photographer",
  "Graphic Designer", "Animator", "Comic Artist", "Tattoo Artist",
  "Musician", "Singer", "Composer", "DJ / Producer",
  "Writer", "Poet",
  "Filmmaker", "Actor", "Dancer", "Podcaster", "Voice Artist",
  "Fashion Designer", "Jewelry Designer", "Textile / Craft Artist",
  "Ceramicist", "Woodworker / Maker",
  "Architect", "Interior Designer", "UI/UX Designer", "Game Artist",
  "Content Creator", "Small Creative Business",
];

function CompleteProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [username, setUsername] = useState("");
  // usernameStatus: "idle" | "checking" | "available" | "taken" | "invalid"
  const [usernameStatus, setUsernameStatus] = useState("idle");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Runs when the user clicks away from the username field.
  // We check on "blur" (not on every keystroke) to avoid hammering
  // Firestore with a read on every letter typed.
  const handleUsernameBlur = async () => {
    if (!username) {
      setUsernameStatus("idle");
      return;
    }

    if (!isValidUsernameFormat(username)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const available = await isUsernameAvailable(username);
    setUsernameStatus(available ? "available" : "taken");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!discipline) {
      setError("Please select what kind of artist you are.");
      return;
    }
    if (!isValidUsernameFormat(username)) {
      setError("Username must be 3-20 characters: lowercase letters, numbers, underscores only.");
      return;
    }

    setSubmitting(true);

    try {
      // Claim the username FIRST — if it's taken (e.g. someone else grabbed
      // it seconds ago), this throws before we do anything else, so we
      // don't waste an image upload on a submission that's about to fail.
      await claimUsername(user.uid, username);

      let photoURL = "";
      if (photoFile) {
        photoURL = await uploadImage(photoFile);
      }

      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        bio,
        discipline,
        ...(photoURL && { photoURL }),
        updatedAt: new Date(),
      });

      navigate("/");
    } catch (err) {
      setError(err.message);
    }

    setSubmitting(false);
  };

  const usernameHelperText = {
    idle: "",
    checking: "Checking availability...",
    available: "✓ Available",
    taken: "✗ Already taken",
    invalid: "3-20 characters: lowercase letters, numbers, underscores only",
  }[usernameStatus];

  const usernameHelperColor = {
    idle: "#666666",
    checking: "#666666",
    available: "#1a7f37",
    taken: "#B00020",
    invalid: "#B00020",
  }[usernameStatus];

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Tell us about you</h1>
      <p style={styles.subtext}>This helps people discover your work.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.photoRow}>
          <div style={styles.photoPreviewCircle}>
            {photoPreview ? (
              <img src={photoPreview} alt="Profile preview" style={styles.photoImg} />
            ) : (
              <span style={styles.photoPlaceholder}>Photo</span>
            )}
          </div>
          <label style={styles.uploadLabel}>
            Choose photo
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          </label>
        </div>

        <input
          type="text"
          placeholder="Full name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          style={styles.input}
        />

        <div>
          <div style={styles.usernameRow}>
            <span style={styles.usernamePrefix}>nijey.com/@</span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => {
                // Force lowercase as they type, so they never submit mixed case
                setUsername(e.target.value.toLowerCase());
                setUsernameStatus("idle");
              }}
              onBlur={handleUsernameBlur}
              required
              style={{ ...styles.input, marginBottom: 0 }}
            />
          </div>
          {usernameHelperText && (
            <p style={{ ...styles.helperText, color: usernameHelperColor }}>
              {usernameHelperText}
            </p>
          )}
        </div>

        <select
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          required
          style={styles.input}
        >
          <option value="">What kind of artist are you?</option>
          {DISCIPLINES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <textarea
          placeholder="A short bio (optional)"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          style={{ ...styles.input, resize: "vertical" }}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: "360px", margin: "4rem auto", padding: "2rem", fontFamily: "Inter, sans-serif" },
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
  photoRow: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" },
  photoPreviewCircle: {
    width: "64px", height: "64px", borderRadius: "50%", border: "1px solid #ECECEC",
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
    backgroundColor: "#F7F7F7", flexShrink: 0,
  },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  photoPlaceholder: { fontSize: "0.7rem", color: "#666666" },
  uploadLabel: {
    fontSize: "0.9rem", color: "#111111", border: "1px solid #ECECEC",
    padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer",
  },
  usernameRow: { display: "flex", alignItems: "center", gap: "0.4rem" },
  usernamePrefix: { color: "#666666", fontSize: "0.9rem", whiteSpace: "nowrap" },
  helperText: { fontSize: "0.8rem", marginTop: "0.25rem" },
};

export default CompleteProfile;
