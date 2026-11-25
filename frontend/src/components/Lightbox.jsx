import { useEffect, useState } from "react";

export default function Lightbox({ photos, index, setIndex, selectedIds, onToggle, locked, onClose }) {
  const [zoom, setZoom] = useState(false);
  const photo = photos[index];
  const last = photos.length - 1;
  const selected = selectedIds.includes(photo.id);

  useEffect(() => { setZoom(false); }, [index]);

  // Keyboard: Esc closes, left/right arrows change photo
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, last));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last, onClose, setIndex]);

  return (
    <div className="lightbox">
      <div className="lightbox-top">
        <span>{index + 1} / {photos.length}</span>
        <div className="lightbox-tools">
          <button onClick={() => setZoom(!zoom)}>{zoom ? "Zoom out" : "Zoom"}</button>
          {!locked && (
            <button className={selected ? "on" : ""} onClick={() => onToggle(photo.id)}>
              {selected ? "✓ Selected" : "♡ Select"}
            </button>
          )}
          <button onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>
      <div className="lightbox-stage">
        <img
          src={photo.full}
          alt={photo.name}
          className={zoom ? "zoomed" : ""}
          onClick={() => setZoom(!zoom)}
        />
      </div>
      {index > 0 && <button className="lb-nav prev" onClick={() => setIndex(index - 1)} aria-label="Previous photo">‹</button>}
      {index < last && <button className="lb-nav next" onClick={() => setIndex(index + 1)} aria-label="Next photo">›</button>}
    </div>
  );
}
