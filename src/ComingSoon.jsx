import { useState } from "react";
import Gallery from "./components/Gallery";

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGallery, setShowGallery] = useState(false);

  if (showGallery) {
    return <Gallery onBack={() => setShowGallery(false)} />;
  }
  const handleJoin = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": import.meta.env.VITE_BREVO_API_KEY,
        },
        body: JSON.stringify({
          email: email,
          listIds: [3],
          updateEnabled: true,
        }),
      });

      if (response.ok || response.status === 204) {
        setJoined(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: "serif",
        background: "#FAF8F4",
      }}
    >
    <button onClick={() => setShowGallery(true)}>
        View Office Get-Togethers
      </button>

      <p
        style={{
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity: 0.4,
          fontFamily: "sans-serif",
        }}
      >
        Something is growing
      </p>

      <h1
        style={{
          fontSize: "72px",
          fontWeight: 300,
          margin: "0.5rem 0",
          color: "#1C1C1A",
        }}
      >
        Nijey
      </h1>

      <p
        style={{
          fontSize: "18px",
          fontStyle: "italic",
          color: "#9B9489",
          margin: "0 0 2rem",
        }}
      >
        Where creativity comes to breathe.
      </p>

      {!joined ? (
        <>
          <div
            style={{
              display: "flex",
              gap: "0",
              border: "1px solid #ccc",
              borderRadius: "8px",
              overflow: "hidden",
              marginTop: "1rem",
            }}
          >
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "12px 16px",
                fontSize: "14px",
                border: "none",
                outline: "none",
                background: "transparent",
                width: "240px",
                fontFamily: "sans-serif",
              }}
            />
            <button
              onClick={handleJoin}
              disabled={loading}
              style={{
                padding: "12px 20px",
                fontSize: "13px",
                border: "none",
                borderLeft: "1px solid #ccc",
                background: "#000",
                cursor: "pointer",
                fontFamily: "sans-serif",
                color: "#fff",
              }}
            >
              {loading ? "..." : "Notify me"}
            </button>
          </div>

          {error && (
            <p
              style={{
                fontSize: "12px",
                color: "red",
                marginTop: "0.5rem",
                fontFamily: "sans-serif",
              }}
            >
              {error}
            </p>
          )}

          <p
            style={{
              fontSize: "12px",
              marginTop: "1rem",
              fontFamily: "sans-serif",
              color: "#000",
            }}
          >
            Nijey is almost ready. We'll tell you the moment it's live. Until
            then go make something beautiful.
          </p>
        </>
      ) : (
        <p
          style={{
            fontSize: "18px",
            fontStyle: "italic",
            color: "#000",
            marginTop: "2rem",
          }}
        >
          You're on the list.
        </p>
      )}
    </div>
  );
}
