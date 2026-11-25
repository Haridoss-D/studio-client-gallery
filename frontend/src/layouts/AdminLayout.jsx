import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/galleries", "Galleries"],
  ["/admin/upload", "Upload Photos"],
  ["/admin/clients", "Clients"],
  ["/admin/selected", "Selected Photos"],
  ["/admin/settings", "Settings"],
];

export default function AdminLayout() {
  const { token, logout } = useAuth();

  // Not logged in? Send the visitor to the login page.
  if (!token) return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin">
      <aside className="sidebar">
        <div className="brand">Studio Frame</div>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/admin"} className="nav-link">
            {label}
          </NavLink>
        ))}
        <button className="nav-link logout" onClick={logout}>
          Logout
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
