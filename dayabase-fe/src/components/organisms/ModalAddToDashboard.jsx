import { useState, useEffect } from "react";
import { API } from "axios/axios";

export default function ModalAddToDashboard({ questionId, onClose }) {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDashboards = async () => {
      const response = await API.get("/api/dashboards");
      setDashboards(response.data);
      if (response.data.length > 0) {
        setSelectedDashboardId(response.data[0].id);
      }
    };
    fetchDashboards();
  }, []);

  const handleSubmit = async () => {
    if (!selectedDashboardId) {
      alert("Pilih dashboard terlebih dahulu.");
      return;
    }
    setIsSubmitting(true);
    try {
      await API.post(`/api/dashboards/${selectedDashboardId}/questions`, {
        question_id: questionId,
      });
      alert("Pertanyaan berhasil ditambahkan ke dashboard!");
      onClose();
    } catch (error) {
      alert("Gagal menambahkan pertanyaan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Tambahkan ke Dashboard</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pilih Dashboard
          </label>
          <select
            value={selectedDashboardId}
            onChange={(e) => setSelectedDashboardId(e.target.value)}
            className="w-full rounded-md border-gray-300"
          >
            {dashboards.map((d) => (
              <option
                key={d.id}
                value={d.id}
              >
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300"
          >
            {isSubmitting ? "Menambahkan..." : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}
