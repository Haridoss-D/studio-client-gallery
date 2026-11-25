import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { errorMessage } from "../services/api";
import { createGallery, getGallery, updateGallery } from "../services/galleryApi";

const empty = {
  clientName: "", clientEmail: "", clientPhone: "", title: "", description: "",
  photoshootDate: "", selectionLimit: 20, expiryDate: "",
};

// One form used for both "Create gallery" and "Edit gallery".
export default function GalleryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // When editing, load the gallery from the API and fill in the form.
  useEffect(() => {
    if (!id) return;
    getGallery(id)
      .then((g) =>
        setForm({
          clientName: g.client.name, clientEmail: g.client.email, clientPhone: g.client.phone || "",
          title: g.title, description: g.description || "", photoshootDate: g.photoshoot_date || "",
          selectionLimit: g.selection_limit, expiryDate: g.expiry_date || "",
        })
      )
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    const limit = Number(form.selectionLimit);
    if (!form.clientName.trim() || !form.clientEmail.trim() || !form.title.trim()) {
      return setError("Client name, client email and gallery title are required.");
    }
    if (!Number.isInteger(limit) || limit < 1) {
      return setError("Selection limit must be a whole number of at least 1.");
    }
    if (form.photoshootDate && form.expiryDate && form.expiryDate < form.photoshootDate) {
      return setError("The expiry date can't be before the photoshoot date.");
    }

    const payload = {
      client_name: form.clientName.trim(),
      client_email: form.clientEmail.trim(),
      client_phone: form.clientPhone.trim(),
      title: form.title.trim(),
      description: form.description,
      photoshoot_date: form.photoshootDate || null,
      selection_limit: limit,
      expiry_date: form.expiryDate || null,
    };

    setSaving(true);
    setError("");
    try {
      const saved = id ? await updateGallery(id, payload) : await createGallery(payload);
      navigate(`/admin/galleries/${saved.id}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="notice">Loading…</p>;

  return (
    <>
      <Link to={id ? `/admin/galleries/${id}` : "/admin/galleries"} className="back-link">← Back</Link>
      <h1 className="page-title" style={{ marginTop: 8 }}>{id ? "Edit gallery" : "Create gallery"}</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">Client name
            <input value={form.clientName} onChange={set("clientName")} />
          </label>
          <label className="field">Client email
            <input type="email" value={form.clientEmail} onChange={set("clientEmail")} />
          </label>
          <label className="field">Client phone
            <input value={form.clientPhone} onChange={set("clientPhone")} />
          </label>
          <label className="field">Gallery title
            <input value={form.title} onChange={set("title")} />
          </label>
          <label className="field full">Description
            <textarea rows={3} value={form.description} onChange={set("description")} />
          </label>
          <label className="field">Photoshoot date
            <input type="date" value={form.photoshootDate} onChange={set("photoshootDate")} />
          </label>
          <label className="field">Selection limit
            <input type="number" min="1" value={form.selectionLimit} onChange={set("selectionLimit")} />
            <span className="hint">How many photos the client may choose.</span>
          </label>
          <label className="field">Gallery expiry date
            <input type="date" value={form.expiryDate} onChange={set("expiryDate")} />
            <span className="hint">Leave empty for no expiry.</span>
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button className="btn btn-gold" disabled={saving}>
            {saving ? "Saving…" : id ? "Save changes" : "Create gallery"}
          </button>
          <Link to="/admin/galleries" className="btn">Cancel</Link>
        </div>
      </form>
    </>
  );
}
