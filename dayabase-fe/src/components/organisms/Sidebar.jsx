// src/components/layout/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { GiThunderball } from "react-icons/gi";
import {
  RiLayoutGridLine,
  RiCodeSSlashLine,
  RiDatabase2Line,
  RiTeamLine,
  RiLogoutBoxRLine,
  RiDashboardLine,
} from "react-icons/ri";

// Helper untuk styling NavLink yang aktif
const getLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-600 text-white"
      : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
  }`;

export default function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "ADMIN";

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
      <div>
        <div className="flex items-center gap-1 mb-8 text-2xl font-bold">
          <h1 className="text-gray-900">DayaBase </h1>
          <div className="text-indigo-600">
            <GiThunderball />
          </div>
        </div>
        <nav className="space-y-2">
          <NavLink
            to="/"
            className={getLinkClass}
            end
          >
            <RiLayoutGridLine className="h-5 w-5" />
            <span>Dashboards</span>
          </NavLink>
          <NavLink
            to="/questions"
            className={getLinkClass}
          >
            <RiCodeSSlashLine className="h-5 w-5" />
            <span>All Questions</span>
          </NavLink>
          <NavLink
            to="/settings/connections"
            className={getLinkClass}
          >
            <RiDatabase2Line className="h-5 w-5" />
            <span>Connections</span>
          </NavLink>

          {/* Tampilkan menu ini hanya jika user adalah Admin */}
          {isAdmin && (
            <NavLink
              to="/settings/users"
              className={getLinkClass}
            >
              <RiTeamLine className="h-5 w-5" />
              <span>Users</span>
            </NavLink>
          )}
        </nav>
      </div>

      <div className="mt-auto">
        <NavLink
          to="/mvp"
          className={getLinkClass}
          end
        >
          <RiDashboardLine className="h-5 w-5" />
          <span>Demo MVP</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
        >
          <RiLogoutBoxRLine className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
