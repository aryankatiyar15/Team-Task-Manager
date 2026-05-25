import { BarChart3, FolderKanban, ListChecks, LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">TT</div>
          <div>
            <strong>Team Task</strong>
            <span>Manager</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          <NavLink to="/" end>
            <BarChart3 size={18} />
            Dashboard
          </NavLink>
          <NavLink to="/projects">
            <FolderKanban size={18} />
            Projects
          </NavLink>
          <NavLink to="/tasks">
            <ListChecks size={18} />
            Tasks
          </NavLink>
        </nav>

        <div className="user-card">
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          <button className="icon-button" type="button" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
