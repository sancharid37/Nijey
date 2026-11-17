// jsx
// src/pages/Home.jsx
//
// The homepage. Its job: in one glance, tell a new visitor what Nijey is
// and what to do next.

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Home.css";

function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <section className="home-hero">
        <h1 className="home-title">Share the journey, not just the finished piece.</h1>
        <p className="home-subtitle">
          Nijey is where artists document their creative process, one update at a time.
        </p>
        <div className="home-buttons">
          <Link to={user ? "/journey/new" : "/signup"} className="home-btn home-btn-primary">
            Start a journey
          </Link>
          <Link to="/discover" className="home-btn home-btn-secondary">
            Explore Discover
          </Link>
        </div>
      </section>

      <section className="home-steps">
        <div className="home-step">
          <p className="home-step-number">1</p>
          <h3>Start a journey</h3>
          <p>Pick your art form and set a goal for what you're making.</p>
        </div>
        <div className="home-step">
          <p className="home-step-number">2</p>
          <h3>Add updates</h3>
          <p>Post progress photos and notes as you go, and build a timeline.</p>
        </div>
        <div className="home-step">
          <p className="home-step-number">3</p>
          <h3>Get seen</h3>
          <p>Let others follow your work, like it, and leave comments.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;