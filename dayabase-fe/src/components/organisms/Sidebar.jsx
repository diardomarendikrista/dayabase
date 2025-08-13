import { NavLink } from "react-router-dom";
import {
  RiLayoutGridLine,
  RiCodeSSlashLine,
  RiDatabase2Line,
  RiTeamLine,
  RiDashboardLine,
} from "react-icons/ri";

const getLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-600 text-white"
      : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
  }`;

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "ADMIN";

  return (
    <aside className="w-52 bg-white border-r border-gray-200 p-4">
      <nav className="space-y-2 flex flex-col justify-between h-full">
        <div className="space-y-2">
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
            end
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
          {isAdmin && (
            <NavLink
              to="/settings/users"
              className={getLinkClass}
            >
              <RiTeamLine className="h-5 w-5" />
              <span>Users</span>
            </NavLink>
          )}
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
        </div>
      </nav>
    </aside>
  );
}
