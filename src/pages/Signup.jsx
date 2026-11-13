import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Step 1: create the actual login credential in Firebase Auth.
      const userCredential = await signup(email, password);
      const newUser = userCredential.user;

      // Step 2: create a matching document in Firestore's "users" collection.
      // We use the SAME id (newUser.uid) as the doc id, so it's always
      // easy to look up "this logged-in user's profile" with one read.
      // Fields like displayName/bio/discipline start empty — filled in
      // on the next page (Complete Profile).
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        username: "",
        displayName: "",
        photoURL: "",
        bio: "",
        discipline: "",
        followerCount: 0,
        followingCount: 0,
        journeyCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate("/complete-profile");
    } catch (err) {
      setError(err.message);
    }

    setSubmitting(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Create your account</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p style={styles.footerText}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "360px",
    margin: "4rem auto",
    padding: "2rem",
    fontFamily: "Inter, sans-serif",
  },
  heading: { color: "#111111", marginBottom: "1.5rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  input: {
    padding: "0.75rem",
    border: "1px solid #ECECEC",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  button: {
    padding: "0.75rem",
    backgroundColor: "#000000",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  error: { color: "#B00020", fontSize: "0.875rem" },
  footerText: { marginTop: "1.5rem", color: "#666666", fontSize: "0.875rem" },
};

export default Signup;
