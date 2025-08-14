import { API } from "axios/axios";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmationModal from "components/molecules/ConfirmationModal";
import { PromptModal } from "components/molecules/PromptModal";

export default function DashboardPage() {
  const [dashboards, setDashboards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // State untuk mengelola modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const openDeleteModal = (dashboard) => {
    setItemToDelete(dashboard);
    setShowDeleteModal(true);
  };
  const handleCreateDashboard = async (name) => {
    if (name) {
      try {
        const response = await API.post("/api/dashboards", { name });
        navigate(`/dashboards/${response.data.id}`);
      } catch (error) {
        alert("Failed to create dashboard.");
      }
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await API.delete(`/api/dashboards/${itemToDelete.id}`);
      setDashboards((prev) => prev.filter((d) => d.id !== itemToDelete.id));
    } catch (err) {
      alert("Failed to delete dashboard.");
    }
  };

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const response = await API.get("/api/dashboards");
        setDashboards(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboards", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboards();
  }, []);

  if (isLoading) return <p>Loading dashboards...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboards</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
        >
          Create New Dashboard
        </button>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {dashboards?.map((d) => (
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
                  {d.description || "No description"}
                </p>
              </Link>
              <button
                onClick={() => openDeleteModal(d)}
                className="text-red-500 hover:text-red-700 font-semibold"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
        {dashboards.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            You don't have any dashboards yet.
          </p>
        )}
      </div>

      <ConfirmationModal
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        title="Delete Dashboard"
        message={`Are you sure you want to delete the dashboard "${itemToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Yes, Delete"
        isDestructive={true}
      />

      <PromptModal
        showModal={showCreateModal}
        setShowModal={setShowCreateModal}
        title="Create New Dashboard"
        message="Enter a name for your new dashboard:"
        onConfirm={handleCreateDashboard}
        closeOnOverlayClick={false}
        inputPlaceholder="Dashboard Name"
      />
    </div>
  );
}
