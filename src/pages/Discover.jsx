// src/pages/Discover.jsx
//
// A feed of recent public journeys, most recently active first.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentJourneys } from "../services/journey.service.js";

function Discover() {
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getRecentJourneys();
        setJourneys(data);
      } catch (err) {
        console.error(err);
        setError("Couldn't load journeys right now.");
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Discover</h1>
      <p style={styles.subtext}>Journeys from artists across every discipline.</p>

      {loading && <p style={styles.muted}>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && journeys.length === 0 && (
        <p style={styles.muted}>No journeys yet — be the first to start one.</p>
      )}

      <div style={styles.grid}>
        {journeys.map((journey) => (
          <Link key={journey.id} to={`/journey/${journey.id}`} style={styles.card}>
            <div style={styles.cardImageBox}>
              {journey.coverImageURL ? (
                <img src={journey.coverImageURL} alt={journey.title} style={styles.cardImage} />
              ) : (
                <div style={styles.cardImagePlaceholder} />
              )}
            </div>
            <div style={styles.cardBody}>
              <span style={styles.cardDiscipline}>{journey.discipline}</span>
              <h3 style={styles.cardTitle}>{journey.title}</h3>
              <div style={styles.cardAuthorRow}>
                {journey.authorPhotoURL && (
                  <img src={journey.authorPhotoURL} alt="" style={styles.cardAuthorAvatar} />
                )}
                <span style={styles.cardAuthorName}>{journey.authorUsername}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: "960px", margin: "2rem auto", padding: "0 1.5rem 4rem", fontFamily: "Inter, sans-serif" },
  heading: { color: "#111111", marginBottom: "0.25rem" },
  subtext: { color: "#666666", marginBottom: "2rem", fontSize: "0.95rem" },
  muted: { color: "#666666" },
  error: { color: "#B00020" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    textDecoration: "none",
    color: "inherit",
    border: "1px solid #ECECEC",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "background-color 0.15s",
  },
  cardImageBox: { width: "100%", height: "180px", backgroundColor: "#F7F7F7" },
  cardImage: { width: "100%", height: "100%", objectFit: "cover" },
  cardImagePlaceholder: { width: "100%", height: "100%", backgroundColor: "#F7F7F7" },
  cardBody: { padding: "0.85rem" },
  cardDiscipline: {
    fontSize: "0.7rem", color: "#666666", border: "1px solid #ECECEC",
    borderRadius: "100px", padding: "0.15rem 0.6rem",
  },
  cardTitle: { color: "#111111", fontSize: "1rem", margin: "0.5rem 0" },
  cardAuthorRow: { display: "flex", alignItems: "center", gap: "0.4rem" },
  cardAuthorAvatar: { width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" },
  cardAuthorName: { fontSize: "0.8rem", color: "#666666" },
};

export default Discover;
