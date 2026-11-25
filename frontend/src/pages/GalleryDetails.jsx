import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useLoad from "../hooks/useLoad";
import { errorMessage } from "../services/api";
import { deleteGallery, getGallery, reopenGallery } from "../services/galleryApi";
import { listPhotos } from "../services/photoService";
import { formatDate, statusClass, statusLabel } from "./Galleries";
import "../styles/upload.css";

export default function GalleryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: g, loading, error, reload } = useLoad(() => getGallery(id), [id]);
  const { data: photos } = useLoad(() => listPhotos(id), [id]);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState("");

  if (loading && !g) return <p className="notice">Loading…</p>;
  if (error) {
    return <div className="empty"><p>{error}</p><Link to="/admin/galleries" className="btn">Back to galleries</Link></div>;
  }

  const link = `${window.location.origin}/gallery/${g.private_token}/`;

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${g.title}" and all its photos? This cannot be undone.`)) return;
    try {
      await deleteGallery(g.id);
      navigate("/admin/galleries");
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  async function handleReopen() {
    try {
      await reopenGallery(g.id);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  const info = [
    ["Client", g.client.name],
    ["Email", g.client.email],
    ["Phone", g.client.phone || "—"],
    ["Photoshoot date", formatDate(g.photoshoot_date)],
    ["Selection limit", g.selection_limit],
    ["Expires", g.expiry_date ? formatDate(g.expiry_date) : "Never"],
    ["Photos uploaded", g.photo_count],
    ["Photos selected", `${g.selected_count} / ${g.selection_limit}`],
  ];

  return (
    <>
      <Link to="/admin/galleries" className="back-link">← All galleries</Link>
      <div className="page-head" style={{ marginTop: 8 }}>
        <h1 className="page-title">{g.title}</h1>
        <span className={`badge badge-${statusClass[g.status]}`}>{statusLabel[g.status]}</span>
      </div>
      {g.description && <p style={{ color: "rgba(242,239,233,.7)", marginBottom: 24 }}>{g.description}</p>}

      <h2 className="section-title" style={{ marginTop: 0 }}>Private client link</h2>
      <div className="link-box">
        <code>{link}</code>
        <button className="btn btn-gold" onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</button>
      </div>

      <div className="detail-grid">
        {info.map(([label, value]) => (
          <div className="detail-item" key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>

      {actionError && <p className="error">{actionError}</p>}
      <div className="actions">
        <Link to={`/admin/upload?gallery=${g.id}`} className="btn btn-gold">Upload photos</Link>
        <Link to={`/admin/galleries/${g.id}/edit`} className="btn">Edit details</Link>
        {(g.status === "submitted" || g.status === "completed") && (
          <button className="btn" onClick={handleReopen}>Reopen for client</button>
        )}
        <button className="btn btn-danger" onClick={handleDelete}>Delete gallery</button>
      </div>

      <h2 className="section-title">Photos</h2>
      {photos && photos.length === 0 && (
        <div className="empty"><p>No photos yet. Use "Upload photos" to add some.</p></div>
      )}
      {photos && photos.length > 0 && (
        <div className="queue">
          {photos.map((p) => (
            <div className="queue-card" key={p.id}>
              <img src={p.thumbnail} alt={p.filename} loading="lazy" />
              <div className="queue-info"><div className="queue-name" title={p.filename}>{p.filename}</div></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
