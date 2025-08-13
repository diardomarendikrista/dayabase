import ModalChangePassword from "components/molecules/ModalChangePassword";
import { useState, useEffect, useRef } from "react";
import {
  RiArrowDownSLine,
  RiLockPasswordLine,
  RiLogoutBoxRLine,
} from "react-icons/ri";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const dropdownRef = useRef(null);

  // Menutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (!user) return null;

  return (
    <div
      className="relative"
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
      >
        <span className="font-semibold">{user.fullName || user.email}</span>
        <RiArrowDownSLine />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-[10px] w-48 bg-white rounded-md shadow-lg z-20">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsOpen(false);
            }}
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <RiLockPasswordLine />
            <span>Change Password</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <RiLogoutBoxRLine />
            <span>Logout</span>
          </button>
        </div>
      )}

      <ModalChangePassword
        showModal={isModalOpen}
        setShowModal={setIsModalOpen}
      />
    </div>
  );
}
