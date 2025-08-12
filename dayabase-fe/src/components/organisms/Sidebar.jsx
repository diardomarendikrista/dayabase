// src/components/layout/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { GiThunderball } from "react-icons/gi";
import {
  RiDashboardLine,
  RiDatabase2Line,
  RiCodeSSlashLine,
  RiLayoutGridLine,
  RiLogoutBoxRLine,
} from "react-icons/ri";

// Helper untuk styling NavLink yang aktif
const getLinkClass = ({ isActive }) =>
  `block px-4 py-2 rounded-md text-sm font-medium flex gap-2 ${
    isActive ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-200"
  }`;

export default function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <aside className="w-50 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
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
            <RiDashboardLine className="h-5 w-5" />
            <span>MVP</span>
          </NavLink>
          <NavLink
            to="/settings/connections"
            className={getLinkClass}
          >
            <RiDatabase2Line className="h-5 w-5" />
            <span>Connections</span>
          </NavLink>
          <NavLink
            to="/questions"
            className={getLinkClass}
            end
          >
            <RiCodeSSlashLine className="h-5 w-5" />
            <span>All Questions</span>
          </NavLink>
          <NavLink
            to="/dashboards"
            className={getLinkClass}
            end
          >
            <RiLayoutGridLine className="h-5 w-5" />
            <span>Dashboards</span>
          </NavLink>
        </nav>
      </div>

      <div className="mt-auto">
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
