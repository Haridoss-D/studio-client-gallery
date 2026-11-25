import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useLoad from "../hooks/useLoad";
import { errorMessage } from "../services/api";
import { listGalleries } from "../services/galleryApi";
import { deletePhoto, listPhotos, uploadPhoto } from "../services/photoService";
import "../styles/upload.css";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 25;
const sizeText = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export default function UploadPhotos() {
  const [params, setParams] = useSearchParams();
  const galleryId = params.get("gallery") || "";
  const { data: galleries, loading, error } = useLoad(listGalleries);
  const [photos, setPhotos] = useState([]);
  const [queue, setQueue] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const inputRef = useRef();
  const waiting = queue.filter((x) => x.status === "waiting").length;

  // Load the gallery's photos from the database whenever the gallery changes.
  useEffect(() => {
    setPhotos([]);
    if (!galleryId) return;
    listPhotos(galleryId)
      .then(setPhotos)
      .catch((err) => setMessage({ type: "error", text: errorMessage(err) }));
  }, [galleryId]);

  const patch = (id, changes) =>
    setQueue((q) => q.map((x) => (x.id === id ? { ...x, ...changes } : x)));

  function dropFromQueue(item) {
    URL.revokeObjectURL(item.preview);
    setQueue((q) => q.filter((x) => x.id !== item.id));
  }

  function chooseGallery(e) {
    queue.forEach((item) => URL.revokeObjectURL(item.preview));
    setQueue([]);
    setMessage(null);
    setParams(e.target.value ? { gallery: e.target.value } : {});
  }

  function addFiles(fileList) {
    if (!galleryId) return setMessage({ type: "error", text: "Choose a gallery first." });
    const items = [...fileList].map((file) => {
      let problem = "";
      if (!TYPES.includes(file.type)) problem = "Only JPG, PNG or WebP files.";
      else if (file.size > MAX_MB * 1048576) problem = `Larger than ${MAX_MB} MB.`;
      return {
        id: crypto.randomUUID(), file, preview: URL.createObjectURL(file),
        progress: 0, status: problem ? "error" : "waiting", error: problem,
      };
    });
    setQueue((q) => [...q, ...items]);
    setMessage(null);
  }

  async function startUpload() {
    const next = queue.filter((x) => x.status === "waiting");
    if (!next.length) return;
    setBusy(true);
    setMessage(null);
    let ok = 0;
    let failed = 0;

    async function worker() {
      for (let item; (item = next.shift()); ) {
        patch(item.id, { status: "uploading" });
        try {
          const photo = await uploadPhoto(galleryId, item.file, (p) => patch(item.id, { progress: p }));
          setPhotos((list) => [...list, photo]);
          dropFromQueue(item);
          ok++;
        } catch (err) {
          patch(item.id, { status: "error", error: errorMessage(err) });
          failed++;
        }
      }
    }
    await Promise.all([worker(), worker(), worker()]); // 3 uploads at a time

    setBusy(false);
    setMessage({
      type: failed ? "error" : "success",
      text: `${ok} photo${ok === 1 ? "" : "s"} uploaded${failed ? `, ${failed} failed.` : "."}`,
    });
  }

  async function removePhoto(photo) {
    if (!window.confirm(`Delete ${photo.filename}? This also removes it from Cloudinary.`)) return;
    try {
      await deletePhoto(photo.id);
      setPhotos((list) => list.filter((p) => p.id !== photo.id));
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    }
  }

  if (loading) return <p className="notice">Loading…</p>;
  if (error) return <p className="error">{error}</p>;
  if (galleries.length === 0) {
    return (
      <>
        <h1 className="page-title">Upload Photos</h1>
        <div className="empty">
          <p>Create a gallery first, then upload its photos here.</p>
          <Link to="/admin/galleries/new" className="btn btn-gold">Create a gallery</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Upload Photos</h1>

      <label className="field" style={{ maxWidth: 420 }}>
        Gallery
        <select value={galleryId} onChange={chooseGallery}>
          <option value="">Choose a gallery…</option>
          {galleries.map((g) => (
            <option key={g.id} value={g.id}>{g.title} — {g.client.name}</option>
          ))}
        </select>
        {galleryId && <span className="hint">{photos.length} photos in this gallery</span>}
      </label>

      <div
        className={`dropzone ${dragging ? "dragging" : ""} ${galleryId ? "" : "disabled"}`}
        onClick={() => galleryId && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
      >
        <h2>Drop photos here</h2>
        <p>or click to browse · JPG, PNG or WebP · up to {MAX_MB} MB each</p>
        <input
          ref={inputRef} type="file" multiple hidden accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {message && <p className={`message ${message.type}`}>{message.text}</p>}

      {queue.length > 0 && (
        <>
          <div className="upload-bar">
            <span>{queue.length} file{queue.length === 1 ? "" : "s"} in the queue · {waiting} ready to upload</span>
            <button className="btn btn-gold" disabled={busy || waiting === 0} onClick={startUpload}>
              {busy ? "Uploading…" : `Upload ${waiting} photo${waiting === 1 ? "" : "s"}`}
            </button>
          </div>
          <div className="queue">
            {queue.map((item) => (
              <div className="queue-card" key={item.id}>
                <img src={item.preview} alt="" />
                <button className="remove-btn" aria-label="Remove from queue" disabled={item.status === "uploading"} onClick={() => dropFromQueue(item)}>✕</button>
                <div className="queue-info">
                  <div className="queue-name" title={item.file.name}>{item.file.name}</div>
                  <div className={`queue-meta ${item.status === "error" ? "err" : ""}`}>
                    {item.status === "error" && item.error}
                    {item.status === "waiting" && sizeText(item.file.size)}
                    {item.status === "uploading" && (item.progress >= 100 ? "Saving…" : `Uploading ${item.progress}%`)}
                  </div>
                  {item.status === "uploading" && <div className="progress"><div style={{ width: `${item.progress}%` }} /></div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {photos.length > 0 && (
        <>
          <h2 className="section-title">Photos in this gallery</h2>
          <div className="queue">
            {photos.map((p) => (
              <div className="queue-card" key={p.id}>
                <img src={p.thumbnail} alt={p.filename} loading="lazy" />
                <button className="remove-btn" aria-label="Delete photo" onClick={() => removePhoto(p)}>✕</button>
                <div className="queue-info"><div className="queue-name" title={p.filename}>{p.filename}</div></div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
