// src/pages/Login.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      // Firebase gives specific error codes like "auth/invalid-credential" —
      // we show a friendlier generic message instead of the raw Firebase text,
      // since "wrong password" vs "no such user" shouldn't be distinguished
      // to the person trying to log in (that's a small security best practice —
      // it stops someone from using error messages to guess valid emails).
      setError("Incorrect email or password.");
    }

    setSubmitting(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome back</h1>

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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p style={styles.footerText}>
        Don't have an account? <Link to="/signup">Sign up</Link>
        {" · "}
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </div>
  );
}

const styles = {
  container: { maxWidth: "360px", margin: "4rem auto", padding: "2rem", fontFamily: "Inter, sans-serif" },
  heading: { color: "#111111", marginBottom: "1.5rem" },
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
  footerText: { marginTop: "1.5rem", color: "#666666", fontSize: "0.875rem" },
};

export default Login;
