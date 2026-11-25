import { useState } from "react";
import { Link } from "react-router-dom";
import useLoad from "../hooks/useLoad";
import { listGalleries } from "../services/galleryApi";
import "../styles/selected.css";

export function selectionStatus(status) {
  return {
    pending: { label: "Awaiting client", cls: "pending" },
    reopened: { label: "Reopened", cls: "reopened" },
    submitted: { label: "Submitted", cls: "submitted" },
    completed: { label: "Completed", cls: "submitted" },
  }[status];
}

export default function SelectedPhotos() {
  const { data: galleries, loading, error } = useLoad(listGalleries);
  const [filter, setFilter] = useState("all");

  const rows = (galleries || []).filter((g) => filter === "all" || g.status === filter);

  return (
    <>
      <h1 className="page-title">Selected Photos</h1>
      {loading && <p className="notice">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {galleries && galleries.length === 0 && (
        <div className="empty"><p>No galleries yet. Selections appear here once clients submit them.</p></div>
      )}

      {galleries && galleries.length > 0 && (
        <>
          <label className="field filter-row">
            Show
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All galleries</option>
              <option value="submitted">Submitted</option>
              <option value="completed">Completed</option>
              <option value="reopened">Reopened</option>
              <option value="pending">Awaiting client</option>
            </select>
          </label>

          {rows.length === 0 ? (
            <div className="empty"><p>No galleries match this filter.</p></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client</th><th>Gallery</th><th>Total photos</th>
                    <th>Selected</th><th>Status</th><th>Submitted</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((g) => {
                    const s = selectionStatus(g.status);
                    return (
                      <tr key={g.id}>
                        <td>{g.client.name}<div className="cell-sub">{g.client.email}</div></td>
                        <td className="cell-title">{g.title}</td>
                        <td>{g.photo_count}</td>
                        <td>{g.selected_count} / {g.selection_limit}</td>
                        <td><span className={`badge badge-${s.cls}`}>{s.label}</span></td>
                        <td>{g.submitted_at ? new Date(g.submitted_at).toLocaleString() : "—"}</td>
                        <td><Link to={`/admin/selected/${g.id}`} className="btn">View selection</Link></td>
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
