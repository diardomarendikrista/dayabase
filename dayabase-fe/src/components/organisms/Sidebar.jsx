// src/components/layout/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { GiThunderball } from "react-icons/gi";

// Helper untuk styling NavLink yang aktif
const getLinkClass = ({ isActive }) =>
  `block px-4 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-200"
  }`;

export default function Sidebar() {
  return (
    <aside className="w-50 bg-white border-r border-gray-200 p-4">
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
        >
          MVP
        </NavLink>
        <NavLink
          to="/settings/connections"
          className={getLinkClass}
        >
          Connections
        </NavLink>
        <NavLink
          to="/questions"
          className={getLinkClass}
        >
          All Questions
        </NavLink>
        <NavLink
          to="/dashboards"
          className={getLinkClass}
        >
          Dashboards
        </NavLink>
      </nav>
    </aside>
  );
}
