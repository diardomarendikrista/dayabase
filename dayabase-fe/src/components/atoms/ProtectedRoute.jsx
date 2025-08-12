import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("authToken");

  if (!token) {
    // Jika tidak ada token, arahkan ke halaman login
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Jika ada token, tampilkan halaman yang diminta
  return <Outlet />;
}
