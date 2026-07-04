import { useEffect, useCallback } from "react";

export default function Lightbox({ items, index, onClose, onNavigate }) {
  const current = items[index];

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % items.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + items.length) % items.length);
    },
    [index, items.length, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  if (!current) return null;

  return (
    <div className="lightbox-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <button
        className="lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      {items.length > 1 && (
        <>
          <button
            className="lightbox-nav lightbox-nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + items.length) % items.length);
            }}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            className="lightbox-nav lightbox-nav--next"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % items.length);
            }}
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}

      <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
        {current.type === "photo" ? (
          <img src={current.url} alt={current.caption || ""} className="lightbox-image" />
        ) : (
          <div className="lightbox-video-wrap">
            <video
              key={current.url}
              src={current.url}
              controls
              autoPlay
              playsInline
            />
          </div>
        )}
        {current.caption && <p className="lightbox-caption">{current.caption}</p>}
        <p className="lightbox-counter">
          {index + 1} / {items.length}
        </p>
      </div>
    </div>
  );
}
