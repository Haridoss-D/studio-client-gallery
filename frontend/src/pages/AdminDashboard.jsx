import { Link } from "react-router-dom";
import useLoad from "../hooks/useLoad";
import { getDashboard } from "../services/galleryApi";
import { statusClass, statusLabel } from "./Galleries";

export default function AdminDashboard() {
  const { data, loading, error } = useLoad(getDashboard);

  const stats = data && [
    ["Total galleries", data.total_galleries],
    ["Total clients", data.total_clients],
    ["Uploaded photos", data.total_photos],
    ["Pending selections", data.pending_selections],
    ["Submitted selections", data.submitted_selections],
  ];

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      {loading && <p className="notice">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {data && (
        <>
          <div className="stats">
            {stats.map(([label, value]) => (
              <div className="stat-card" key={label}>
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
              </div>
            ))}
          </div>

          <h2 className="section-title">Recent galleries</h2>
          {data.recent_galleries.length === 0 ? (
            <div className="empty">
              <p>No galleries yet. Create your first gallery to send a private link to a client.</p>
              <Link to="/admin/galleries/new" className="btn btn-gold">Create a gallery</Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {data.recent_galleries.map((g) => (
                    <tr key={g.id}>
                      <td className="cell-title">{g.title}</td>
                      <td>{g.client.name}</td>
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
      )}
    </>
  );
}
