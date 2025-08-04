import { API } from "axios/axios";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function ConnectionsListPage() {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setIsLoading(true);
      const response = await API.get("/api/connections");
      setConnections(response.data);
    } catch (err) {
      setError("Gagal mengambil data koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus koneksi ini?")) {
      try {
        await API.delete(`/api/connections/${id}`);
        setConnections((prev) => prev.filter((conn) => conn.id !== id));
      } catch (err) {
        alert(err.response?.data?.message || "Gagal menghapus koneksi.");
      }
    }
  };

  if (isLoading) return <p>Memuat koneksi...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Database Connections</h1>
        <Link
          to="/settings/connections/new"
          className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
        >
          Add Connection
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {connections.map((conn) => (
            <li
              key={conn.id}
              className="py-4 flex justify-between items-center"
            >
              <Link
                to={`/settings/connections/${conn.id}/edit`}
                className="hover:text-indigo-600 font-semibold"
              >
                <p className="font-bold text-lg">
                  {conn.connection_name}{" "}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({conn.db_type})
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  {conn.db_user}@{conn.host}:{conn.port}/{conn.database_name}
                </p>
              </Link>
              <div className="space-x-4">
                <button
                  onClick={() => handleDelete(conn.id)}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {connections.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            Belum ada koneksi. Tambahkan satu untuk memulai.
          </p>
        )}
      </div>
    </div>
  );
}
