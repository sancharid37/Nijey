// src/pages/Settings/EditProfile.jsx
//
// Lets a logged-in user update their own profile: name, bio, discipline,
// and profile picture. Loads existing values first, unlike CompleteProfile
// which always starts blank.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext.jsx";
import { uploadImage } from "../../services/cloudinary.service.js";

const JOURNEY_DISCIPLINES = [
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

function EditProfile() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill the form once userProfile has loaded from AuthContext.
  // We can't do this at useState() time because userProfile might still
  // be null on the very first render (before Firestore data arrives).
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setBio(userProfile.bio || "");
      setDiscipline(userProfile.discipline || "");
      setPhotoPreview(userProfile.photoURL || null);
      setCoverPreview(userProfile.coverPhotoURL || null);
    }
  }, [userProfile]);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);

    try {
      let photoURL = userProfile.photoURL || "";
      if (photoFile) {
        photoURL = await uploadImage(photoFile);
      }

      let coverPhotoURL = userProfile.coverPhotoURL || "";
      if (coverFile) {
        coverPhotoURL = await uploadImage(coverFile);
      }

      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        bio,
        discipline,
        photoURL,
        coverPhotoURL,
        updatedAt: new Date(),
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }

    setSubmitting(false);
  };

  if (!userProfile) {
    return <div style={styles.container}><p style={styles.muted}>Loading...</p></div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Edit profile</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.coverBox}>
          {coverPreview ? (
            <img src={coverPreview} alt="Cover preview" style={styles.coverImg} />
          ) : (
            <span style={styles.coverPlaceholder}>Cover photo</span>
          )}
          <label style={styles.coverUploadLabel}>
            Change cover
            <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
          </label>
        </div>

        <div style={styles.photoRow}>
          <div style={styles.photoPreviewCircle}>
            {photoPreview ? (
              <img src={photoPreview} alt="Profile preview" style={styles.photoImg} />
            ) : (
              <span style={styles.photoPlaceholder}>Photo</span>
            )}
          </div>
          <label style={styles.uploadLabel}>
            Change photo
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

        <select
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          required
          style={styles.input}
        >
          <option value="">What kind of artist are you?</option>
          {JOURNEY_DISCIPLINES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <textarea
          placeholder="A short bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          style={{ ...styles.input, resize: "vertical" }}
        />

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>Profile updated.</p>}

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: "360px", margin: "4rem auto", padding: "0 1.5rem", fontFamily: "Inter, sans-serif" },
  heading: { color: "#111111", marginBottom: "1.5rem" },
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
  success: { color: "#1a7f37", fontSize: "0.875rem" },
  muted: { color: "#666666" },
  photoRow: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" },
  coverBox: {
    width: "100%", height: "120px", borderRadius: "8px", border: "1px solid #ECECEC",
    backgroundColor: "#F7F7F7", position: "relative", overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem",
  },
  coverImg: { width: "100%", height: "100%", objectFit: "cover" },
  coverPlaceholder: { fontSize: "0.85rem", color: "#666666" },
  coverUploadLabel: {
    position: "absolute", bottom: "0.5rem", right: "0.5rem",
    fontSize: "0.8rem", color: "#111111", backgroundColor: "#FFFFFF",
    border: "1px solid #ECECEC", padding: "0.35rem 0.75rem", borderRadius: "6px", cursor: "pointer",
  },
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
};

export default EditProfile;
