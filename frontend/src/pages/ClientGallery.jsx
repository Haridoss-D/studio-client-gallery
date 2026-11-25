import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Lightbox from "../components/Lightbox";
import { clientError, loadGallery, setSelected, submitSelection } from "../services/clientApi";
import { formatDate } from "./Galleries";
import "../styles/client.css";

export default function ClientGallery() {
  const { token } = useParams();
  const [g, setG] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [lightbox, setLightbox] = useState(null); // index of the open photo, or null
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGallery(token).then(setG).catch((err) => setLoadError(clientError(err)));
  }, [token]);

  // The Lightbox expects { id, name, thumb, full }
  const photos = useMemo(
    () => (g ? g.photos.map((p) => ({ id: p.id, name: p.filename, thumb: p.thumbnail, full: p.preview })) : []),
    [g?.photos]
  );

  if (loadError) return <div className="client-message"><h1>{loadError}</h1></div>;
  if (!g) return <div className="client-message"><p>Loading your gallery…</p></div>;

  const ids = g.selected_ids;
  const limit = g.selection_limit;
  const locked = g.locked;

  // Saves the choice in the database; the server decides whether it is allowed.
  async function toggle(photoId) {
    if (locked) return;
    const isSelected = ids.includes(photoId);
    if (!isSelected && ids.length >= limit) {
      return setMessage(`You've reached your limit of ${limit} photos. Unselect one to choose another.`);
    }
    setMessage("");
    const before = ids;
    setG((cur) => ({ ...cur, selected_ids: isSelected ? ids.filter((x) => x !== photoId) : [...ids, photoId] }));
    try {
      const result = await setSelected(token, photoId, !isSelected);
      setG((cur) => ({ ...cur, selected_ids: result.selected_ids }));
    } catch (err) {
      setG((cur) => ({ ...cur, selected_ids: before }));
      setMessage(clientError(err));
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      setG(await submitSelection(token));
      setMessage("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setMessage(clientError(err));
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="client">
      <header className="client-header">
        <p className="client-logo">Studio Frame</p>
        <h1>{g.title}</h1>
        <p className="client-sub">
          Prepared for {g.client_name}
          {g.photoshoot_date && ` · ${formatDate(g.photoshoot_date)}`} · {photos.length} photos
        </p>
        <p className="client-sub">Choose up to {limit} favourites. Your choices are saved automatically.</p>
      </header>

      {locked && (
        <div className="client-banner success">
          <strong>Thank you, your selection has been submitted.</strong>
          {g.submitted_at && <span>Sent on {new Date(g.submitted_at).toLocaleString()}. Your photographer will be in touch.</span>}
        </div>
      )}
      {message && <div className="client-banner warn">{message}</div>}

      {photos.length === 0 ? (
        <div className="client-message"><p>Your photos aren't ready yet. Please check back soon.</p></div>
      ) : (
        <div className="masonry">
          {photos.map((p, i) => {
            const selected = ids.includes(p.id);
            return (
              <figure key={p.id} className={selected ? "photo selected" : "photo"}>
                <img src={p.thumb} alt={p.name} loading="lazy" onClick={() => setLightbox(i)} />
                {(!locked || selected) && (
                  <button
                    className="pick"
                    disabled={locked}
                    aria-label={selected ? "Unselect photo" : "Select photo"}
                    onClick={() => toggle(p.id)}
                  >
                    {selected ? "✓" : "♡"}
                  </button>
                )}
              </figure>
            );
          })}
        </div>
      )}

      <div className="client-bar">
        <p className="count">{ids.length} / {limit} <span>selected</span></p>
        <button className="submit-btn" disabled={locked || ids.length === 0} onClick={() => setConfirming(true)}>
          {locked ? "Submitted" : "Submit selection"}
        </button>
      </div>

      {confirming && (
        <div className="modal-back">
          <div className="modal">
            <h2>Submit {ids.length} photo{ids.length === 1 ? "" : "s"}?</h2>
            <p>You won't be able to change your selection afterwards unless your photographer reopens it.</p>
            <div className="modal-actions">
              <button className="ghost" onClick={() => setConfirming(false)}>Keep editing</button>
              <button className="submit-btn" disabled={submitting} onClick={submit}>
                {submitting ? "Submitting…" : "Yes, submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightbox !== null && (
        <Lightbox
          photos={photos}
          index={lightbox}
          setIndex={setLightbox}
          selectedIds={ids}
          onToggle={toggle}
          locked={locked}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
