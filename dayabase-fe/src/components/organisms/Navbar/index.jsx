import { Link } from "react-router-dom";
import { GiThunderball } from "react-icons/gi";
import UserDropdown from "./UserDropDown";

export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center flex-shrink-0">
      <Link
        to="/"
        className="flex items-center gap-2 text-2xl font-bold"
      >
        <div className="text-indigo-600">
          <GiThunderball />
        </div>
        <h1 className="text-gray-900">DayaBase</h1>
      </Link>

      <UserDropdown />
    </header>
  );
}
