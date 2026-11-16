// src/pages/Profile.jsx
//
// Shows a user's profile (photo, name, bio, discipline) and their journeys.
// Also has the Follow / Following button for other people's profiles.
// Profiles are login-only (see Firestore rules), so logged-out visitors
// see a "Log in / Sign up" prompt instead.
// URL shape: /:username (e.g. nijey.com/sanchari)

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserByUsername } from "../services/user.service.js";
import { getUserJourneys } from "../services/journey.service.js";
import { isFollowing, followUser, unfollowUser } from "../services/follow.service.js";
import { useAuth } from "../context/AuthContext.jsx";

function Profile() {
  const { username } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState("");

  useEffect(() => {
    // Logged out: don't try to load, because the Firestore read would be
    // rejected. The page shows a login prompt instead (see below).
    if (!user) return;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const profileData = await getUserByUsername(username);
        if (!profileData) {
          setError("No artist found with that username.");
          setLoading(false);
          return;
        }
        setProfile(profileData);
        setFollowerCount(profileData.followerCount || 0);

        const journeysData = await getUserJourneys(profileData.id);
        setJourneys(journeysData);

        // Check follow status only on other people's profiles.
        if (user.uid !== profileData.id) {
          const alreadyFollowing = await isFollowing(user.uid, profileData.id);
          setFollowing(alreadyFollowing);
        } else {
          setFollowing(false);
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading this profile.");
      }
      setLoading(false);
    }
    load();
  }, [username, user]);

  const handleToggleFollow = async () => {
    if (!user || followBusy) return;
    setFollowBusy(true);
    setFollowError("");

    const wasFollowing = following;

    // Update the screen first so it feels instant...
    setFollowing(!wasFollowing);
    setFollowerCount((prev) => (wasFollowing ? Math.max(prev - 1, 0) : prev + 1));

    try {
      if (wasFollowing) {
        await unfollowUser(user.uid, profile.id);
      } else {
        await followUser(user.uid, profile.id);
      }
    } catch (err) {
      // ...and put it back if the database said no.
      console.error(err);
      setFollowing(wasFollowing);
      setFollowerCount((prev) => (wasFollowing ? prev + 1 : Math.max(prev - 1, 0)));
      setFollowError("Couldn't update follow. Please try again.");
    }

    setFollowBusy(false);
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.loginPrompt}>
          <h2 style={styles.loginPromptHeading}>Log in to view this profile</h2>
          <p style={styles.muted}>Join Nijey to see artists and follow their journeys.</p>
          <div style={styles.loginPromptButtons}>
            <Link to="/login" style={styles.followButton}>Log in</Link>
            <Link to="/signup" style={styles.followingButton}>Sign up</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div style={styles.container}><p style={styles.muted}>Loading...</p></div>;
  if (error) return <div style={styles.container}><p style={styles.error}>{error}</p></div>;

  const isOwnProfile = user.uid === profile.id;

  return (
    <div style={styles.container}>
      {profile.coverPhotoURL && (
        <div style={styles.coverBanner}>
          <img src={profile.coverPhotoURL} alt="" style={styles.coverBannerImg} />
        </div>
      )}
      <div style={styles.header}>
        {profile.photoURL ? (
          <img src={profile.photoURL} alt={profile.username} style={styles.avatar} />
        ) : (
          <div style={styles.avatarPlaceholder} />
        )}

        <h1 style={styles.name}>{profile.displayName || profile.username}</h1>
        <p style={styles.username}>{profile.username}</p>
        {profile.discipline && <span style={styles.discipline}>{profile.discipline}</span>}
        {profile.bio && <p style={styles.bio}>{profile.bio}</p>}

        <div style={styles.statsRow}>
          <span><strong>{journeys.length}</strong> journeys</span>
          <span><strong>{followerCount}</strong> followers</span>
          <span><strong>{profile.followingCount || 0}</strong> following</span>
        </div>

        {isOwnProfile ? (
          <Link to="/settings/profile" style={styles.editButton}>Edit profile</Link>
        ) : (
          <button
            onClick={handleToggleFollow}
            disabled={followBusy}
            style={following ? styles.followingButton : styles.followButton}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}

        {followError && <p style={styles.error}>{followError}</p>}
      </div>

      <div style={styles.journeysSection}>
        <h2 style={styles.sectionHeading}>Journeys</h2>
        {journeys.length === 0 ? (
          <p style={styles.muted}>No journeys yet.</p>
        ) : (
          <div style={styles.grid}>
            {journeys.map((journey) => (
              <Link key={journey.id} to={`/journey/${journey.id}`} style={styles.card}>
                <div style={styles.cardImageBox}>
                  {journey.coverImageURL && (
                    <img src={journey.coverImageURL} alt={journey.title} style={styles.cardImage} />
                  )}
                </div>
                <div style={styles.cardBody}>
                  <span style={styles.cardDiscipline}>{journey.discipline}</span>
                  <h3 style={styles.cardTitle}>{journey.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: "720px", margin: "2rem auto", padding: "0 1.5rem 4rem", fontFamily: "Inter, sans-serif" },
  header: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "2.5rem" },
  coverBanner: { width: "100%", height: "160px", borderRadius: "8px", overflow: "hidden", marginBottom: "-3rem" },
  coverBannerImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatar: { width: "96px", height: "96px", borderRadius: "50%", objectFit: "cover", marginBottom: "1rem" },
  avatarPlaceholder: { width: "96px", height: "96px", borderRadius: "50%", backgroundColor: "#F7F7F7", marginBottom: "1rem" },
  name: { color: "#111111", margin: 0 },
  username: { color: "#666666", fontSize: "0.9rem", margin: "0.25rem 0" },
  discipline: {
    fontSize: "0.75rem", color: "#666666", border: "1px solid #ECECEC",
    borderRadius: "100px", padding: "0.15rem 0.6rem", display: "inline-block", marginTop: "0.5rem",
  },
  bio: { color: "#111111", marginTop: "0.75rem", maxWidth: "420px", lineHeight: 1.5 },
  statsRow: { display: "flex", gap: "1.5rem", marginTop: "1.25rem", color: "#666666", fontSize: "0.9rem" },
  editButton: {
    marginTop: "1.25rem", padding: "0.5rem 1.2rem", border: "1px solid #ECECEC",
    borderRadius: "6px", color: "#111111", textDecoration: "none", fontSize: "0.9rem",
  },
  followButton: {
    marginTop: "1.25rem", padding: "0.5rem 1.4rem", backgroundColor: "#000000", color: "#FFFFFF",
    border: "1px solid #000000", borderRadius: "6px", fontSize: "0.9rem", cursor: "pointer",
    textDecoration: "none", fontFamily: "inherit",
  },
  followingButton: {
    marginTop: "1.25rem", padding: "0.5rem 1.4rem", backgroundColor: "#FFFFFF", color: "#111111",
    border: "1px solid #ECECEC", borderRadius: "6px", fontSize: "0.9rem", cursor: "pointer",
    textDecoration: "none", fontFamily: "inherit",
  },
  loginPrompt: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "3rem 0" },
  loginPromptHeading: { color: "#111111", marginBottom: "0.5rem" },
  loginPromptButtons: { display: "flex", gap: "0.75rem", marginTop: "0.5rem" },
  journeysSection: { borderTop: "1px solid #ECECEC", paddingTop: "1.5rem" },
  sectionHeading: { color: "#111111", marginBottom: "1rem" },
  muted: { color: "#666666" },
  error: { color: "#B00020", fontSize: "0.875rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.25rem" },
  card: {
    textDecoration: "none", color: "inherit", border: "1px solid #ECECEC",
    borderRadius: "10px", overflow: "hidden", display: "flex", flexDirection: "column",
  },
  cardImageBox: { width: "100%", height: "140px", backgroundColor: "#F7F7F7" },
  cardImage: { width: "100%", height: "100%", objectFit: "cover" },
  cardBody: { padding: "0.7rem" },
  cardDiscipline: {
    fontSize: "0.65rem", color: "#666666", border: "1px solid #ECECEC",
    borderRadius: "100px", padding: "0.1rem 0.5rem",
  },
  cardTitle: { color: "#111111", fontSize: "0.9rem", margin: "0.4rem 0 0" },
};

export default Profile;