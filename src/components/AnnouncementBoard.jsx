import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import ConfirmDialog from "./ConfirmDialog";
import "./AnnouncementBoard.css";

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18" strokeLinecap="round" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v6M14 11v6" strokeLinecap="round" />
  </svg>
);

// Same Cloudinary account used for gallery photos/videos.
const CLOUDINARY_CLOUD_NAME = "ymruyjhg";
const CLOUDINARY_UPLOAD_PRESET = "nijey_uploads";

async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!response.ok) throw new Error("Cloudinary upload failed");
  const data = await response.json();
  return data.secure_url;
}

function formatDate(timestamp) {
  if (!timestamp?.seconds) return "";
  return new Date(timestamp.seconds * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Login failed — check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="announce__login" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign In to Post"}
      </button>
      {error && <p className="announce__status announce__status--error">{error}</p>}
    </form>
  );
}

function PostForm() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) {
      setStatus("Please add a title and some content.");
      return;
    }
    setBusy(true);
    setStatus(image ? "Uploading image…" : "Posting…");
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImageToCloudinary(image);
      }
      await addDoc(collection(db, "announcements"), {
        title: title.trim(),
        text: text.trim(),
        imageUrl,
        authorEmail: auth.currentUser?.email || null,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setText("");
      setImage(null);
      setStatus("Posted.");
      e.target.reset?.();
    } catch {
      setStatus("Something went wrong — check your Firebase rules.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="announce__post-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Next Get-Together!"
          required
        />
      </label>
      <label>
        Content
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your announcement here…"
          rows={3}
          required
        />
      </label>
      <label>
        Image (optional)
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0] || null)}
        />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? "Posting…" : "Post Announcement"}
      </button>
      {status && <p className="announce__status">{status}</p>}
    </form>
  );
}

function AnnouncementList({ items, canDelete, onRequestDelete }) {
  if (items.length === 0) {
    return <p className="announce__empty">No announcements yet.</p>;
  }

  return (
    <ul className="announce__list">
      {items.map((item) => (
        <li key={item.id} className="announce__item">
          <div className="announce__item-header">
            <h3 className="announce__item-title">{item.title}</h3>
            {canDelete && (
              <button
                className="announce__delete"
                onClick={() => onRequestDelete(item.id)}
                aria-label="Delete announcement"
              >
                <TrashIcon /> Remove
              </button>
            )}
          </div>
          {item.imageUrl && (
            <img className="announce__image" src={item.imageUrl} alt="" loading="lazy" />
          )}
          <p className="announce__text">{item.text}</p>
          <div className="announce__meta">
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AnnouncementBoard() {
  const [items, setItems] = useState(null); // null = loading
  const [user, setUser] = useState(undefined); // undefined = auth loading
  const [showPost, setShowPost] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteDoc(doc(db, "announcements", pendingDeleteId));
    } catch {
      // rare — user can just retry
    }
    setPendingDeleteId(null);
  };

  return (
    <section className="announce">
      <div className="announce__header">
        <h2 className="announce__title">Announcements</h2>
        <button
          className="announce__toggle"
          onClick={() => setShowPost((v) => !v)}
        >
          {showPost ? "Close" : "+ Post"}
        </button>
      </div>

      {showPost && (
        <div className="announce__panel">
          {user === undefined && <p className="announce__status">Loading…</p>}
          {user === null && <LoginForm />}
          {user && (
            <>
              <p className="announce__signed-in">
                Signed in as {user.email}{" "}
                <button className="announce__signout" onClick={() => signOut(auth)}>
                  Sign out
                </button>
              </p>
              <PostForm />
            </>
          )}
        </div>
      )}

      {items === null ? (
        <p className="announce__status">Loading…</p>
      ) : (
        <AnnouncementList
          items={items}
          canDelete={!!user}
          onRequestDelete={setPendingDeleteId}
        />
      )}

      {pendingDeleteId && (
        <ConfirmDialog
          message="Delete this announcement? This can't be undone."
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </section>
  );
}
