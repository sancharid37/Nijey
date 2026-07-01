import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Lightbox from "./Lightbox";
import UploadPanel from "./UploadPanel";
import { db } from "../firebase";
import "./Gallery.css";

// Small deterministic "randomness" so polaroids tilt consistently
// on every render instead of jittering around.
function tiltFor(seed) {
  const angles = [-4, 3, -2, 5, -5, 2, -3, 4];
  return angles[seed % angles.length];
}

function groupByEvent(docs) {
  const map = new Map();
  docs.forEach((d) => {
    if (!map.has(d.event)) {
      map.set(d.event, { id: d.event, title: d.event, items: [], latest: d.createdAt });
    }
    const group = map.get(d.event);
    group.items.push(d);
    if (d.createdAt && (!group.latest || d.createdAt.seconds > group.latest.seconds)) {
      group.latest = d.createdAt;
    }
  });
  return Array.from(map.values());
}

function EventBoard({ event, eventIndex, onOpen }) {
  const photos = useMemo(() => event.items.filter((i) => i.type === "photo"), [event]);
  const videos = useMemo(() => event.items.filter((i) => i.type === "video"), [event]);

  const dateLabel = event.latest?.seconds
    ? new Date(event.latest.seconds * 1000).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <section className="board" aria-labelledby={`board-title-${event.id}`}>
      <header className="board__header">
        <h2 id={`board-title-${event.id}`} className="board__title">
          {event.title}
        </h2>
        {dateLabel && <span className="board__date">{dateLabel}</span>}
      </header>

      {photos.length > 0 && (
        <div className="board__photos">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              className="polaroid"
              style={{ "--tilt": `${tiltFor(i + eventIndex)}deg` }}
              onClick={() => onOpen(event.items, event.items.indexOf(photo))}
            >
              <span className="polaroid__tape" aria-hidden="true" />
              <img src={photo.url} alt={photo.caption || ""} loading="lazy" />
              {photo.caption && <span className="polaroid__caption">{photo.caption}</span>}
            </button>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="board__filmstrip">
          {videos.map((video) => (
            <button
              key={video.id}
              className="film-frame"
              onClick={() => onOpen(event.items, event.items.indexOf(video))}
            >
              <img
                src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                alt={video.caption || "Video thumbnail"}
                loading="lazy"
              />
              <span className="film-frame__play" aria-hidden="true">
                ▶
              </span>
              {video.caption && <span className="film-frame__caption">{video.caption}</span>}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Gallery({ onBack }) {
  const [docs, setDocs] = useState(null); // null = loading
  const [active, setActive] = useState(null); // { items, index }
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const events = useMemo(() => (docs ? groupByEvent(docs) : []), [docs]);

  const openAt = (items, index) => setActive({ items, index });
  const close = () => setActive(null);
  const navigate = (index) => setActive((prev) => ({ ...prev, index }));

  return (
    <div className="gallery-page">
      {onBack && (
        <button className="gallery-page__back" onClick={onBack}>
          ← Back
        </button>
      )}
      <header className="gallery-page__intro">
        <p className="gallery-page__eyebrow">Office Memories</p>
        <h1 className="gallery-page__title">Get-Togethers</h1>
        <p className="gallery-page__sub">
          Every outing, every party, pinned up in one place.
        </p>
        <button
          className="gallery-page__upload-toggle"
          onClick={() => setShowUpload((v) => !v)}
        >
          {showUpload ? "Close Upload" : "+ Upload Photos"}
        </button>
      </header>

      {showUpload && <UploadPanel />}

      {docs === null && <p className="gallery-page__status">Loading…</p>}
      {docs !== null && events.length === 0 && (
        <p className="gallery-page__status">
          Nothing uploaded yet — use the Upload page to add your first photos.
        </p>
      )}

      {events.map((event, i) => (
        <EventBoard key={event.id} event={event} eventIndex={i} onOpen={openAt} />
      ))}

      {active && (
        <Lightbox
          items={active.items}
          index={active.index}
          onClose={close}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
