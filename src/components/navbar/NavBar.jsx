// src/components/navbar/NavBar.jsx
//
// Shows different content depending on auth state:
// - Logged in: "Start a Journey", username, and a Log out button
// - Logged out: Log in and Sign up links
// On phones the links live in a drawer that slides in from the right,
// opened by a menu button (see NavBar.css).

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import "./NavBar.css";

function NavBar() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    closeMenu();
    navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  };

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo" onClick={closeMenu}>Nijey</Link>

      <form onSubmit={handleSearchSubmit} className="nav-search">
        <input
          type="text"
          placeholder="Search journeys..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="nav-search-input"
        />
      </form>

      <button
        type="button"
        className="nav-menu-button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div
        className={menuOpen ? "nav-backdrop open" : "nav-backdrop"}
        onClick={closeMenu}
      />

      <div className={menuOpen ? "nav-links open" : "nav-links"}>
        <Link to="/discover" className="nav-link" onClick={closeMenu}>Discover</Link>
        {user ? (
          <>
            <Link to="/journey/new" className="nav-link" onClick={closeMenu}>Start a Journey</Link>
            <Link to={`/${userProfile?.username}`} className="nav-username" onClick={closeMenu}>
              {userProfile?.username || "..."}
            </Link>
            <button onClick={handleLogout} className="nav-logout">Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link" onClick={closeMenu}>Log in</Link>
            <Link to="/signup" className="nav-signup" onClick={closeMenu}>Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;