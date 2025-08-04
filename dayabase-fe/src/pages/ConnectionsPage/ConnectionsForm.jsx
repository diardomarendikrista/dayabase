import { API } from "axios/axios";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ConnectionFormPage() {
  const { id } = useParams(); // Ambil ID dari URL jika ada
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    connection_name: "",
    db_type: "postgres",
    host: "localhost",
    port: 5432,
    db_user: "postgres",
    password: "",
    database_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      const fetchConnectionDetails = async () => {
        try {
          const response = await API.get(`/api/connections/${id}`);
          const conn = response.data;
          setFormData({
            connection_name: conn.connection_name,
            db_type: conn.db_type,
            host: conn.host,
            port: conn.port,
            db_user: conn.db_user,
            password: "", // Selalu kosongkan password demi keamanan
            database_name: conn.database_name,
          });
        } catch (err) {
          alert("Gagal memuat detail koneksi.");
          navigate("/settings/connections");
        }
      };
      fetchConnectionDetails();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (isEditMode) {
        await API.put(`/api/connections/${id}`, formData);
      } else {
        await API.post("/api/connections", formData);
      }
      navigate("/settings/connections"); // Kembali ke daftar setelah berhasil
    } catch (err) {
      setError(err.response?.data?.message || "Operasi gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? "Edit Koneksi" : "Tambah Koneksi Baru"}
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="connection_name"
              value={formData.connection_name}
              onChange={handleChange}
              placeholder="Nama Koneksi (cth: DB Produksi)"
              required
              className="w-full rounded-md border-gray-300"
            />
            <select
              name="db_type"
              value={formData.db_type}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
            </select>
            <input
              name="host"
              value={formData.host}
              onChange={handleChange}
              placeholder="Host"
              required
              className="w-full rounded-md border-gray-300"
            />
            <input
              name="port"
              type="number"
              value={formData.port}
              onChange={handleChange}
              placeholder="Port"
              required
              className="w-full rounded-md border-gray-300"
            />
            <input
              name="db_user"
              value={formData.db_user}
              onChange={handleChange}
              placeholder="User"
              required
              className="w-full rounded-md border-gray-300"
            />
            <input
              name="password"
              value={formData.password}
              onChange={handleChange}
              type="password"
              placeholder={
                isEditMode ? "Biarkan kosong agar tidak berubah" : "Password"
              }
              className="w-full rounded-md border-gray-300"
            />
            <input
              name="database_name"
              value={formData.database_name}
              onChange={handleChange}
              placeholder="Nama Database"
              required
              className="w-full rounded-md border-gray-300"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {isSubmitting
                ? "Menyimpan..."
                : isEditMode
                  ? "Perbarui Koneksi"
                  : "Simpan Koneksi"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
