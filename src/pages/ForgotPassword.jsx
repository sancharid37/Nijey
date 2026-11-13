// src/pages/ForgotPassword.jsx
//
// Sends a password reset email using Firebase Auth's built-in flow.
// Firebase handles generating the reset link and the email itself —
// we just need to trigger it and tell the user to check their inbox.

import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, email);
      // We show the same success message whether or not the email exists,
      // as a small security practice — this stops someone from using this
      // form to check which emails have accounts on Nijey.
      setSent(true);
    } catch (err) {
      setError("Something went wrong. Please check the email and try again.");
    }

    setSubmitting(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Reset your password</h1>

      {sent ? (
        <p style={styles.successText}>
          If an account exists for {email}, a password reset link has been sent.
          Check your inbox (and spam folder).
        </p>
      ) : (
        <>
          <p style={styles.subtext}>
            Enter your email and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" disabled={submitting} style={styles.button}>
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </>
      )}

      <p style={styles.footerText}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}

const styles = {
  container: { maxWidth: "360px", margin: "4rem auto", padding: "2rem", fontFamily: "Inter, sans-serif" },
  heading: { color: "#111111", marginBottom: "0.5rem" },
  subtext: { color: "#666666", marginBottom: "1.5rem", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  input: {
    padding: "0.75rem", border: "1px solid #ECECEC", borderRadius: "6px",
    fontSize: "1rem", width: "100%", boxSizing: "border-box",
  },
  button: {
    padding: "0.75rem", backgroundColor: "#000000", color: "#FFFFFF",
    border: "none", borderRadius: "6px", fontSize: "1rem", cursor: "pointer",
  },
  error: { color: "#B00020", fontSize: "0.875rem" },
  successText: { color: "#1a7f37", fontSize: "0.9rem", lineHeight: 1.5 },
  footerText: { marginTop: "1.5rem", color: "#666666", fontSize: "0.875rem" },
};

export default ForgotPassword;
