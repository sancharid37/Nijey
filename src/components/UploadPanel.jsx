import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./UploadPanel.css";

// Cloudinary is used for photo file storage since it has a genuinely free
// tier with no card required (unlike Firebase Storage, which now needs
// the paid Blaze plan). Fill these in after creating a free Cloudinary
// account — see the README for exact steps.
const CLOUDINARY_CLOUD_NAME = "ymruyjhg";
const CLOUDINARY_UPLOAD_PRESET = "nijey_uploads";

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error("Cloudinary upload failed");
  }

  const data = await response.json();
  return data.secure_url;
}

function extractYoutubeId(url) {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

function LoginForm({ onError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      onError("Login failed — check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="upload-panel__login" onSubmit={handleSubmit}>
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
        {busy ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

function PhotoUploadForm() {
  const [event, setEvent] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event.trim() || files.length === 0) {
      setStatus("Pick an event name and at least one photo.");
      return;
    }
    setBusy(true);
    setStatus(`Uploading 0 / ${files.length}…`);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadToCloudinary(file);
        await addDoc(collection(db, "photos"), {
          type: "photo",
          url,
          event: event.trim(),
          caption: caption.trim(),
          createdAt: serverTimestamp(),
        });
        setStatus(`Uploading ${i + 1} / ${files.length}…`);
      }
      setStatus(`Done — ${files.length} photo(s) added.`);
      setFiles([]);
      setCaption("");
      e.target.reset?.();
    } catch (err) {
      setStatus("Something went wrong — check your Firebase rules/config.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="upload-panel__form" onSubmit={handleSubmit}>
      <h4>Add Photos</h4>
      <label>
        Event name
        <input
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          placeholder="e.g. Diwali Get-Together"
          required
        />
      </label>
      <label>
        Caption (optional)
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. Team lunch by the lake"
        />
      </label>
      <label>
        Photos
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files))}
          required
        />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? "Uploading…" : "Upload Photos"}
      </button>
      {status && <p className="upload-panel__status">{status}</p>}
    </form>
  );
}

function VideoLinkForm() {
  const [event, setEvent] = useState("");
  const [caption, setCaption] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const youtubeId = extractYoutubeId(url);
    if (!event.trim() || !youtubeId) {
      setStatus("Enter an event name and a valid YouTube link.");
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, "photos"), {
        type: "video",
        youtubeId,
        event: event.trim(),
        caption: caption.trim(),
        createdAt: serverTimestamp(),
      });
      setStatus("Video added.");
      setUrl("");
      setCaption("");
    } catch (err) {
      setStatus("Something went wrong — check your Firebase rules/config.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="upload-panel__form" onSubmit={handleSubmit}>
      <h4>Add a Video (YouTube link)</h4>
      <label>
        Event name
        <input
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          placeholder="e.g. Diwali Get-Together"
          required
        />
      </label>
      <label>
        Caption (optional)
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. The dance-off"
        />
      </label>
      <label>
        YouTube URL
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          required
        />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? "Adding…" : "Add Video"}
      </button>
      {status && <p className="upload-panel__status">{status}</p>}
    </form>
  );
}

export default function UploadPanel() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  return (
    <div className="upload-panel">
      {user === undefined && <p className="upload-panel__status">Loading…</p>}

      {user === null && (
        <>
          <LoginForm onError={setLoginError} />
          {loginError && (
            <p className="upload-panel__status upload-panel__status--error">
              {loginError}
            </p>
          )}
        </>
      )}

      {user && (
        <>
          <p className="upload-panel__signed-in">
            Signed in as {user.email}{" "}
            <button className="upload-panel__signout" onClick={() => signOut(auth)}>
              Sign out
            </button>
          </p>
          <div className="upload-panel__forms">
            <PhotoUploadForm />
            <VideoLinkForm />
          </div>
        </>
      )}
    </div>
  );
}
