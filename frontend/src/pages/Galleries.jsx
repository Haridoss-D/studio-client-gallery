import { Link } from "react-router-dom";
import useLoad from "../hooks/useLoad";
import { listGalleries } from "../services/galleryApi";

export const statusLabel = { pending: "Pending", submitted: "Submitted", reopened: "Reopened", completed: "Completed" };
export const statusClass = { pending: "pending", submitted: "submitted", reopened: "reopened", completed: "submitted" };

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function Galleries() {
  const { data: galleries, loading, error } = useLoad(listGalleries);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Galleries</h1>
        <Link to="/admin/galleries/new" className="btn btn-gold">New gallery</Link>
      </div>

      {loading && <p className="notice">Loading galleries…</p>}
      {error && <p className="error">{error}</p>}

      {galleries && galleries.length === 0 && (
        <div className="empty">
          <p>No galleries yet. Create one to get a private link for your client.</p>
          <Link to="/admin/galleries/new" className="btn btn-gold">Create a gallery</Link>
        </div>
      )}

      {galleries && galleries.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Gallery</th><th>Client</th><th>Photoshoot</th><th>Photos</th>
                <th>Selected</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {galleries.map((g) => (
                <tr key={g.id}>
                  <td className="cell-title">{g.title}</td>
                  <td>{g.client.name}<div className="cell-sub">{g.client.email}</div></td>
                  <td>{formatDate(g.photoshoot_date)}</td>
                  <td>{g.photo_count}</td>
                  <td>{g.selected_count} / {g.selection_limit}</td>
                  <td><span className={`badge badge-${statusClass[g.status]}`}>{statusLabel[g.status]}</span></td>
                  <td><Link to={`/admin/galleries/${g.id}`} className="btn">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
