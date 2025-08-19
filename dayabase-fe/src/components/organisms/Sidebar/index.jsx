// File: src/components/organisms/Sidebar.jsx

import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  RiHome4Line,
  RiFolderLine,
  RiDatabase2Line,
  RiTeamLine,
  RiDashboardLine,
  RiMoreFill,
  RiAddLine,
} from "react-icons/ri";
import { API } from "axios/axios";
import ModalAddCollection from "components/molecules/ModalAddCollection";

// Helper for styling active NavLink
const getLinkClass = ({ isActive }) =>
  `flex items-center gap-3 w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-600 text-white"
      : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
  }`;

export default function Sidebar() {
  const [collections, setCollections] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showModalAddCollection, setShowModalAddCollection] = useState(false); // State untuk modal

  const menuRef = useRef(null);

  const user = { role: "ADMIN" }; // Mock user
  const isAdmin = user?.role === "ADMIN";

  const handleOpenModal = () => {
    setIsMenuOpen(false);
    setShowModalAddCollection(true);
  };

  const handleCollectionAdded = (newCollection) => {
    setCollections((prev) => [...prev, newCollection]);
  };

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await API.get("/api/collections");
        setCollections(response.data);
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      }
    };
    fetchCollections();
  }, []);

  // Close dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
        <nav className="space-y-2">
          {/* Main Menu */}
          <NavLink
            to="/"
            className={getLinkClass}
            end
          >
            <RiHome4Line className="h-5 w-5" />
            <span>Home</span>
          </NavLink>

          {/* Collections */}
          <div>
            <div className="relative flex items-center justify-between w-full px-4 py-2 rounded-md text-sm font-medium text-gray-700">
              <div className="flex items-center gap-3">
                <RiFolderLine className="h-5 w-5" />
                <span>Collections</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded-full hover:bg-gray-200"
              >
                <RiMoreFill />
              </button>
              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute top-8 right-0 w-48 bg-white border rounded-md shadow-lg z-10"
                >
                  <button
                    onClick={handleOpenModal}
                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <RiAddLine />
                    <span>Add Collection</span>
                  </button>
                </div>
              )}
            </div>
            <div className="mt-2 pl-8 space-y-1">
              {collections.map((collection) => (
                <NavLink
                  key={collection.id}
                  to={`/collections/${collection.id}`}
                  className={getLinkClass}
                >
                  <span>{collection.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Settings Menu at the bottom */}
        <div className="mt-auto space-y-2">
          <hr className="my-4" />
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
          <NavLink
            to="/mvp"
            className={getLinkClass}
            end
          >
            <RiDashboardLine className="h-5 w-5" />
            <span>Demo MVP</span>
          </NavLink>
        </div>
      </aside>

      <ModalAddCollection
        showModal={showModalAddCollection}
        setShowModal={setShowModalAddCollection}
        onCollectionAdded={handleCollectionAdded}
      />
    </>
  );
}
