import { useState, useEffect } from "react";
import { API } from "axios/axios";
import Modal from "components/molecules/Modal";
import Button from "components/atoms/Button";

// Icons
import {
  FiCopy,
  FiExternalLink,
  FiCheck,
  FiGlobe,
  FiCode,
} from "react-icons/fi";
import { cn } from "lib/utils";

export default function DashboardShareModal({
  dashboardId,
  showModal,
  setShowModal,
}) {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk feedback visual tombol copy
  const [isCopiedUrl, setIsCopiedUrl] = useState(false);
  const [isCopiedEmbed, setIsCopiedEmbed] = useState(false);

  useEffect(() => {
    if (!showModal) return;

    const fetchDashboardDetails = async () => {
      setIsLoading(true);
      try {
        const response = await API.get(`/api/dashboards/${dashboardId}`);
        setDashboardData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard details", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardDetails();
  }, [dashboardId, showModal]);

  const handleToggleSharing = async (enabled) => {
    try {
      // Optimistic update
      setDashboardData((prev) => ({
        ...prev,
        public_sharing_enabled: enabled,
      }));

      const response = await API.put(`/api/dashboards/${dashboardId}/sharing`, {
        enabled,
      });
      setDashboardData((prev) => ({ ...prev, ...response.data }));
    } catch (error) {
      setDashboardData((prev) => ({
        ...prev,
        public_sharing_enabled: !enabled,
      }));
      console.error("Failed to toggle sharing", error);
    }
  };

  const getPublicUrl = () => {
    if (!dashboardData?.public_token) return "";
    return `${window.location.origin}/embed/dashboards/${dashboardData.public_token}`;
  };

  const getIframeCode = () => {
    return `<iframe src="${getPublicUrl()}" frameborder="0" width="100%" height="600" allowtransparency></iframe>`;
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "url") {
        setIsCopiedUrl(true);
        setTimeout(() => setIsCopiedUrl(false), 2000);
      } else {
        setIsCopiedEmbed(true);
        setTimeout(() => setIsCopiedEmbed(false), 2000);
      }
    });
  };

  const handleOpenNewTab = () => {
    window.open(getPublicUrl(), "_blank", "noopener,noreferrer");
  };

  return (
    <Modal
      title="Sharing & Embedding"
      showModal={showModal}
      setShowModal={setShowModal}
      closeOnOverlayClick={false}
      width="max-w-2xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : dashboardData ? (
        <div className="space-y-6">
          {/* SECTION 1: STATUS TOGGLE */}
          <div
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-colors",
              dashboardData.public_sharing_enabled
                ? "bg-primary/5 border-primary/20" // Aksen Ungu Tipis saat Aktif
                : "bg-gray-50 border-gray-200"
            )}
          >
            <div>
              <h4
                className={cn(
                  "font-semibold",
                  dashboardData.public_sharing_enabled
                    ? "text-primary"
                    : "text-gray-900"
                )}
              >
                Public Access
              </h4>
              <p className="text-sm text-gray-500">
                {dashboardData.public_sharing_enabled
                  ? "Anyone with the link can view this dashboard."
                  : "This dashboard is currently private."}
              </p>
            </div>

            <Button
              onClick={() =>
                handleToggleSharing(!dashboardData.public_sharing_enabled)
              }
              // Gunakan variant 'primary' (Ungu) untuk Activate, 'danger' (Merah) untuk Deactivate
              variant={
                dashboardData.public_sharing_enabled ? "danger" : "primary"
              }
              size="sm"
            >
              {dashboardData.public_sharing_enabled
                ? "Deactivate"
                : "Activate Public Link"}
            </Button>
          </div>

          {/* SECTION 2 & 3: DETAILS */}
          {dashboardData.public_sharing_enabled && (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* --- PUBLIC LINK --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FiGlobe className="w-4 h-4 text-primary" /> Public Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getPublicUrl()}
                    onClick={(e) => e.target.select()}
                    // Focus ring menggunakan warna primary (ungu)
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />

                  <Button
                    variant="outline"
                    title="Copy Link"
                    onClick={() => handleCopy(getPublicUrl(), "url")}
                    className="shrink-0 w-[100px]"
                  >
                    {isCopiedUrl ? (
                      <>
                        <FiCheck className="mr-2 text-green-600" /> Copied
                      </>
                    ) : (
                      <>
                        <FiCopy className="mr-2" /> Copy
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    title="Open in New Tab"
                    onClick={handleOpenNewTab}
                    className="shrink-0 px-3 hover:text-primary hover:border-primary"
                  >
                    <FiExternalLink />
                  </Button>
                </div>
              </div>

              {/* --- EMBED CODE --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FiCode className="w-4 h-4 text-primary" /> Embed Code
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={getIframeCode()}
                    onClick={(e) => e.target.select()}
                    // Dark theme code block
                    className="w-full p-3 pr-24 border rounded-md bg-gray-900 text-gray-100 font-mono text-xs h-28 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopy(getIframeCode(), "embed")}
                      className="bg-gray-700 hover:bg-gray-600 border-none text-white text-xs h-8"
                    >
                      {isCopiedEmbed ? (
                        <>
                          <FiCheck className="mr-1 text-green-400" /> Copied
                        </>
                      ) : (
                        <>
                          <FiCopy className="mr-1" /> Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Paste this code into your website's HTML to display the
                  dashboard.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-red-500">
          Failed to load sharing settings.
        </div>
      )}
    </Modal>
  );
}
