import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Lightbox from "../components/Lightbox";
import useLoad from "../hooks/useLoad";
import { completeGallery, reopenGallery } from "../services/galleryApi";
import { errorMessage } from "../services/api";
import { downloadZip, getSelected, saveFile } from "../services/selectionApi";
import { selectionStatus } from "./SelectedPhotos";
import "../styles/client.css"; // lightbox styles
import "../styles/selected.css";

export default function SelectedGallery() {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(() => getSelected(id), [id]);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");

  if (loading && !data) return <p className="notice">Loading…</p>;
  if (error) return <div className="empty"><p>{error}</p><Link to="/admin/selected" className="btn">Back</Link></div>;

  const { gallery: g, photos } = data;
  const status = selectionStatus(g.status);
  const canReopen = g.status === "submitted" || g.status === "completed";
  const lightboxPhotos = photos.map((p) => ({ id: p.id, name: p.filename, thumb: p.thumbnail, full: p.preview }));

  async function run(label, action) {
    setBusy(label);
    setActionError("");
    try {
      await action();
    } catch (err) {
      setActionError(err.response ? errorMessage(err) : err.message);
    } finally {
      setBusy("");
    }
  }

  const zip = () => run("zip", async () => saveFile(await downloadZip(g.id), `${g.title}-selected.zip`));
  const complete = () => run("complete", async () => { await completeGallery(g.id); reload(); });
  const reopen = () => run("reopen", async () => { await reopenGallery(g.id); reload(); });
  const exportNames = () =>
    saveFile(new Blob([photos.map((p) => p.filename).join("\n")], { type: "text/plain" }), `${g.title}-selected.txt`);

  return (
    <>
      <Link to="/admin/selected" className="back-link">← All selections</Link>
      <div className="page-head" style={{ marginTop: 8 }}>
        <h1 className="page-title">{g.title}</h1>
        <span className={`badge badge-${status.cls}`}>{status.label}</span>
      </div>
      <p style={{ color: "rgba(242,239,233,.65)" }}>
        {g.client.name} · {photos.length} of {g.photo_count} photos selected (limit {g.selection_limit})
        {g.submitted_at && ` · submitted ${new Date(g.submitted_at).toLocaleString()}`}
      </p>

      <div className="actions" style={{ marginTop: 20 }}>
        <button className="btn btn-gold" onClick={zip} disabled={photos.length === 0 || busy === "zip"}>
          {busy === "zip" ? "Preparing ZIP…" : "Download all as ZIP"}
        </button>
        <button className="btn" onClick={exportNames} disabled={photos.length === 0}>Export filenames</button>
        {g.status === "submitted" && (
          <button className="btn" onClick={complete} disabled={busy === "complete"}>Mark as completed</button>
        )}
        {canReopen && (
          <button className="btn" onClick={reopen} disabled={busy === "reopen"}>Reopen for client</button>
        )}
      </div>
      {actionError && <p className="error" style={{ marginTop: 12 }}>{actionError}</p>}
      {g.status === "pending" && <p className="hint" style={{ marginTop: 8 }}>The client hasn't submitted yet. These are their choices so far.</p>}

      {photos.length === 0 ? (
        <div className="empty" style={{ marginTop: 24 }}><p>The client hasn't selected any photos yet.</p></div>
      ) : (
        <div className="sel-grid">
          {photos.map((p, i) => (
            <div className="sel-card" key={p.id}>
              <img src={p.thumbnail} alt={p.filename} loading="lazy" onClick={() => setOpen(i)} />
              <div className="sel-foot">
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.filename}>{p.filename}</span>
                <a href={p.download}>Download</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {open !== null && (
        <Lightbox
          photos={lightboxPhotos}
          index={open}
          setIndex={setOpen}
          selectedIds={photos.map((p) => p.id)}
          onToggle={() => {}}
          locked
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
