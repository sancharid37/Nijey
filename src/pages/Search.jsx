// src/pages/Search.jsx
//
// Simple title-based journey search. Not full-text search (Firestore
// doesn't support that natively) — matches titles that START WITH
// what's typed, case-insensitive.

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchJourneysByTitle } from "../services/journey.service.js";

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchJourneysByTitle(text);
      setResults(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // If we arrived here with ?q=something (e.g. from the Navbar search box),
  // run that search automatically on load.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearchText(q);
      runSearch(q);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSearchParams({ q: searchText });
    runSearch(searchText);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Search journeys</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Search</button>
      </form>

      {loading && <p style={styles.muted}>Searching...</p>}

      {!loading && searched && results.length === 0 && (
        <p style={styles.muted}>No journeys found starting with "{searchText}".</p>
      )}

      <div style={styles.results}>
        {results.map((journey) => (
          <Link key={journey.id} to={`/journey/${journey.id}`} style={styles.resultCard}>
            {journey.coverImageURL && (
              <img src={journey.coverImageURL} alt="" style={styles.resultImg} />
            )}
            <div>
              <h3 style={styles.resultTitle}>{journey.title}</h3>
              <p style={styles.resultAuthor}>{journey.authorUsername} · {journey.discipline}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: "560px", margin: "2rem auto", padding: "0 1.5rem 4rem", fontFamily: "Inter, sans-serif" },
  heading: { color: "#111111", marginBottom: "1.5rem" },
  form: { display: "flex", gap: "0.5rem", marginBottom: "2rem" },
  input: {
    flex: 1, padding: "0.75rem", border: "1px solid #ECECEC", borderRadius: "6px",
    fontSize: "1rem", fontFamily: "inherit",
  },
  button: {
    padding: "0.75rem 1.25rem", backgroundColor: "#000000", color: "#FFFFFF",
    border: "none", borderRadius: "6px", fontSize: "1rem", cursor: "pointer",
  },
  muted: { color: "#666666" },
  results: { display: "flex", flexDirection: "column", gap: "1rem" },
  resultCard: {
    display: "flex", gap: "0.75rem", alignItems: "center", textDecoration: "none",
    color: "inherit", border: "1px solid #ECECEC", borderRadius: "8px", padding: "0.75rem",
  },
  resultImg: { width: "56px", height: "56px", borderRadius: "6px", objectFit: "cover" },
  resultTitle: { color: "#111111", fontSize: "0.95rem", margin: 0 },
  resultAuthor: { color: "#666666", fontSize: "0.8rem", margin: "0.25rem 0 0" },
};

export default Search;
