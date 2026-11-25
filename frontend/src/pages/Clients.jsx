import { useState } from "react";
import { Link } from "react-router-dom";
import useLoad from "../hooks/useLoad";
import { listGalleries } from "../services/galleryApi";
import { formatDate } from "./Galleries";

export default function Clients() {
  const { data: galleries, loading, error } = useLoad(listGalleries);
  const [search, setSearch] = useState("");

  // Group the galleries by client (the API sends each gallery with its client).
  const byEmail = new Map();
  for (const g of [...(galleries || [])].reverse()) {
    const entry = byEmail.get(g.client.email) || { ...g.client, galleries: [] };
    entry.galleries.push(g);
    byEmail.set(g.client.email, entry);
  }

  const text = search.trim().toLowerCase();
  const clients = [...byEmail.values()]
    .reverse()
    .filter((c) => !text || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(text));

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Clients</h1>
        <Link to="/admin/galleries/new" className="btn btn-gold">New gallery</Link>
      </div>

      {loading && <p className="notice">Loading clients…</p>}
      {error && <p className="error">{error}</p>}

      {galleries && byEmail.size === 0 && (
        <div className="empty">
          <p>No clients yet. A client is added automatically when you create their first gallery.</p>
          <Link to="/admin/galleries/new" className="btn btn-gold">Create a gallery</Link>
        </div>
      )}

      {byEmail.size > 0 && (
        <>
          <label className="field" style={{ maxWidth: 360 }}>
            Search clients
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or phone" />
          </label>

          {clients.length === 0 ? (
            <div className="empty"><p>No clients match your search.</p></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client</th><th>Phone</th><th>Galleries</th>
                    <th>Submitted</th><th>Latest gallery</th><th>Client since</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => {
                    const latest = c.galleries[c.galleries.length - 1];
                    const done = c.galleries.filter((g) => g.status === "submitted" || g.status === "completed").length;
                    return (
                      <tr key={c.email}>
                        <td className="cell-title">{c.name}<div className="cell-sub">{c.email}</div></td>
                        <td>{c.phone || "—"}</td>
                        <td>{c.galleries.length}</td>
                        <td>{done}</td>
                        <td><Link to={`/admin/galleries/${latest.id}`} className="btn">{latest.title}</Link></td>
                        <td>{formatDate(c.galleries[0].created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
