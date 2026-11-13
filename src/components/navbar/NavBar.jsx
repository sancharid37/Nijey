// src/components/navbar/NavBar.jsx
//
// Shows different content depending on auth state:
// - Logged in: user's name + a Logout button + "Start a Journey" link
// - Logged out: Login + Signup links
// This is the first place we actually CALL logout() from AuthContext.

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

function NavBar() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>Nijey</Link>

      <div style={styles.links}>
        <Link to="/discover" style={styles.link}>Discover</Link>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <input
            type="text"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={styles.searchInput}
          />
        </form>
        {user ? (
          <>
            <Link to="/journey/new" style={styles.link}>Start a Journey</Link>
            <Link to={`/${userProfile?.username}`} style={styles.username}>
              {userProfile?.username || "..."}
            </Link>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Log in</Link>
            <Link to="/signup" style={styles.signupLink}>Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    borderBottom: "1px solid #ECECEC",
    fontFamily: "Inter, sans-serif",
  },
  logo: {
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "#111111",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  link: {
    color: "#111111",
    textDecoration: "none",
    fontSize: "0.9rem",
  },
  searchForm: {
    display: "flex",
  },
  searchInput: {
    padding: "0.4rem 0.75rem",
    border: "1px solid #ECECEC",
    borderRadius: "100px",
    fontSize: "0.85rem",
    width: "160px",
    fontFamily: "inherit",
  },
  signupLink: {
    color: "#FFFFFF",
    backgroundColor: "#000000",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "0.9rem",
  },
  username: {
    color: "#111111",
    fontWeight: 600,
    fontSize: "0.9rem",
    textDecoration: "none",
  },
  logoutButton: {
    background: "none",
    border: "1px solid #ECECEC",
    borderRadius: "6px",
    padding: "0.5rem 1rem",
    fontSize: "0.9rem",
    cursor: "pointer",
    color: "#111111",
  },
};

export default NavBar;
