import { useState, useEffect } from "react";
import { API } from "axios/axios";
import Modal from "components/molecules/Modal";

export default function DashboardShareModal({
  dashboardId,
  showModal,
  setShowModal,
}) {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      try {
        // Endpoint GET /api/dashboards/:id must return public_token and public_sharing_enabled
        const response = await API.get(`/api/dashboards/${dashboardId}`);
        setDashboardData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard details", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardDetails();
  }, [dashboardId]);

  const handleToggleSharing = async (enabled) => {
    try {
      const response = await API.put(`/api/dashboards/${dashboardId}/sharing`, {
        enabled,
      });
      setDashboardData((prev) => ({ ...prev, ...response.data }));
    } catch (error) {
      alert("Failed to change sharing status.");
    }
  };

  const getPublicUrl = () => {
    if (!dashboardData?.public_token) return "";
    return `${window.location.origin}/embed/dashboards/${dashboardData.public_token}`;
  };

  const getIframeCode = () => {
    return `<iframe src="${getPublicUrl()}" frameborder="0" width="800" height="600" allowtransparency></iframe>`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Iframe code copied successfully!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <Modal
      title="Sharing & Embedding"
      showModal={showModal}
      setShowModal={setShowModal}
    >
      {isLoading ? (
        <p>Loading...</p>
      ) : dashboardData ? (
        <div>
          <div className="flex items-center justify-between p-4 border rounded-md">
            <p className="font-medium">Activate Public Link</p>
            <button
              onClick={() =>
                handleToggleSharing(!dashboardData.public_sharing_enabled)
              }
              className={`px-4 py-2 rounded-md text-white font-semibold ${
                dashboardData.public_sharing_enabled
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {dashboardData.public_sharing_enabled ? "Deactivate" : "Activate"}
            </button>
          </div>

          {dashboardData.public_sharing_enabled && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Embed Iframe Code
                </label>
                <textarea
                  readOnly
                  value={getIframeCode()}
                  className="w-full mt-1 p-2 border rounded-md bg-gray-100 font-mono text-sm h-28 resize-none"
                />
                <button
                  onClick={() => copyToClipboard(getIframeCode())}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Copy Code
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>Failed to load data.</p>
      )}
    </Modal>
  );
}
