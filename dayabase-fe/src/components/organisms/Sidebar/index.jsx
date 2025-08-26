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
import ModalAddCollection from "components/molecules/ModalAddCollection";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCollections,
  createCollection,
} from "store/slices/collectionsSlice";
import { addToast } from "store/slices/toastSlice";
import { selectIsAdmin } from "store/slices/authSlice";

// Helper for styling active NavLink
const getLinkClass = ({ isActive }) =>
  `flex items-center gap-3 w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-600 text-white"
      : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
  }`;

export default function Sidebar() {
  const { items: collections, status } = useSelector(
    (state) => state.collections
  );
  const isAdmin = useSelector(selectIsAdmin);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showModalAddCollection, setShowModalAddCollection] = useState(false); // State untuk modal

  const dispatch = useDispatch();
  const menuRef = useRef(null);

  const handleOpenModal = () => {
    setIsMenuOpen(false);
    setShowModalAddCollection(true);
  };

  const handleAddCollection = async (name) => {
    if (!name) return;
    try {
      await dispatch(createCollection({ name })).unwrap(); // .unwrap() akan melempar error jika rejected
      dispatch(
        addToast({
          message: "Collection created successfully!",
          type: "success",
        })
      );
    } catch (error) {
      dispatch(
        addToast({ message: "Failed to create collection.", type: "error" })
      );
    }
  };

  // Fetch collections
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCollections());
    }
  }, [status, dispatch]);

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
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Main Menu */}
        <div className="flex-shrink-0 m-4 mb-2">
          <NavLink
            to="/"
            className={getLinkClass}
            end
          >
            <RiHome4Line className="h-5 w-5" />
            <span>Home</span>
          </NavLink>
        </div>

        {/* Collections */}
        <div className="flex-1 flex flex-col overflow-hidden border-gray-200">
          <div className="flex-shrink-0 px-4">
            <div className="relative flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700">
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
                  className="absolute top-8 right-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10"
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
          </div>

          {/* Daftar Koleksi (Scrollable) */}
          <div className="flex-1 overflow-y-auto pb-4">
            <div className="mt-2 pl-12 pr-4 space-y-1">
              {collections.map((collection) => (
                <NavLink
                  key={collection.id}
                  to={`/collections/${collection.id}`}
                  className={getLinkClass}
                >
                  <span className="truncate">{collection.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Menu at the bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
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
        onConfirm={handleAddCollection}
      />
    </>
  );
}
