// src/components/layout/MainLayout.jsx
import Sidebar from "components/organisms/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {/* <Outlet /> adalah tempat halaman spesifik akan dirender */}
        <Outlet />
      </main>
    </div>
  );
}
