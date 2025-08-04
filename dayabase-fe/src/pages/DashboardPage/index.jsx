import { API } from "axios/axios";
import { useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import ChartWidget from "./DashboardView/ChartWidget";
import { Link, useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const [dashboards, setDashboards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const response = await API.get("/api/dashboards");
        setDashboards(response.data);
      } catch (error) {
        console.error("Gagal mengambil dashboards", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboards();
  }, []);

  const handleCreateDashboard = async () => {
    const name = window.prompt("Masukkan nama untuk dashboard baru:");
    if (name) {
      try {
        const response = await API.post("/api/dashboards", { name });
        // Langsung arahkan ke halaman dashboard yang baru dibuat
        navigate(`/dashboards/${response.data.id}`);
      } catch (error) {
        alert("Gagal membuat dashboard.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus dashboard ini?")) {
      try {
        await API.delete(`/api/dashboards/${id}`);
        setDashboards((prev) => prev.filter((d) => d.id !== id));
      } catch (err) {
        alert("Gagal menghapus dashboard.");
      }
    }
  };

  if (isLoading) return <p>Memuat dashboards...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboards</h1>
        <button
          onClick={handleCreateDashboard}
          className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
        >
          Buat Dashboard Baru
        </button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {dashboards.map((d) => (
            <li
              key={d.id}
              className="py-4 flex justify-between items-center"
            >
              <Link
                to={`/dashboards/${d.id}`}
                className="hover:underline"
              >
                <p className="font-bold text-lg">{d.name}</p>
                <p className="text-sm text-gray-500">
                  {d.description || "Tidak ada deskripsi"}
                </p>
              </Link>
              <button
                onClick={() => handleDelete(d.id)}
                className="text-red-500 hover:text-red-700 font-semibold"
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
        {dashboards.length === 0 && (
          <p className="text-center text-gray-500 py-4">Belum ada dashboard.</p>
        )}
      </div>
    </div>
  );
}
