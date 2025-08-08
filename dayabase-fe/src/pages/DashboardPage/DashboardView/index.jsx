import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { API } from "axios/axios";
import { Responsive, WidthProvider } from "react-grid-layout";
import ChartWidget from "./ChartWidget";
import ModalDashboardShare from "./ModalDashboardShare";
import ModalAddQuestion from "./ModalAddQuestion";
import { MdOutlineShare } from "react-icons/md";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardViewPage() {
  const { id, token } = useParams();
  const location = useLocation();
  const isEmbedMode = location.pathname.includes("/embed/");
  const dashboardIdentifier = id || token;

  const [dashboard, setDashboard] = useState(null);
  const [layout, setLayout] = useState([]);
  const [dashboardName, setDashboardName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showModalShare, setShowModalShare] = useState(false);
  const [showModalAdd, setShowModalAdd] = useState(false);

  const fetchDashboardData = async () => {
    if (!dashboardIdentifier) return;
    setIsLoading(true);

    // URL API berdasarkan mode
    const apiUrl = isEmbedMode
      ? `/api/public/dashboards/${dashboardIdentifier}`
      : `/api/dashboards/${dashboardIdentifier}`;

    try {
      const response = await API.get(apiUrl);
      const data = response.data;
      setDashboard(data);
      setDashboardName(data.name);

      const initialLayout = data.questions.map((q) => ({
        ...q.layout,
        i: q.id.toString(),
      }));
      setLayout(initialLayout);
    } catch (error) {
      console.error("Gagal mengambil data dashboard", error);
      setDashboard(null); // Set ke null jika error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameDashboard = async () => {
    if (isEmbedMode) return; // Tidak bisa rename di mode embed
    if (dashboard && dashboardName && dashboardName !== dashboard.name) {
      try {
        await API.put(`/api/dashboards/${id}`, {
          name: dashboardName,
          description: dashboard.description,
        });
        setDashboard((prev) => ({ ...prev, name: dashboardName }));
      } catch (error) {
        setDashboardName(dashboard.name);
        alert("Gagal menyimpan nama baru.");
      }
    }
  };

  const handleLayoutChange = async (newLayout) => {
    if (isEmbedMode) return;
    setLayout(newLayout);
    try {
      await API.put(`/api/dashboards/${id}/layout`, newLayout);
    } catch (error) {
      console.error("Gagal menyimpan layout", error);
    }
  };

  const handleRemoveWidget = async (questionIdToRemove) => {
    if (isEmbedMode) return;
    if (
      window.confirm(
        "Apakah Anda yakin ingin menghapus chart ini dari dashboard?"
      )
    ) {
      try {
        await API.delete(
          `/api/dashboards/${id}/questions/${questionIdToRemove}`
        );
        setDashboard((prev) => ({
          ...prev,
          questions: prev.questions.filter((q) => q.id !== questionIdToRemove),
        }));
        setLayout((prev) =>
          prev.filter((l) => l.i !== questionIdToRemove.toString())
        );
      } catch (error) {
        alert("Gagal menghapus widget.");
      }
    }
  };

  const handleQuestionAdded = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dashboardIdentifier, isEmbedMode]);

  if (isLoading) return <p>Loading dashboard...</p>;
  if (!dashboard) return <p>Dashboard not found.</p>;

  const existingQuestionIds = dashboard.questions.map((q) => q.id); // show only unadded questions

  return (
    <div>
      {!isEmbedMode && (
        <div className="flex justify-between items-center mb-6">
          <input
            type="text"
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            onBlur={handleRenameDashboard}
            className="text-3xl font-bold bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-md p-1 -m-1 w-1/2"
          />
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowModalAdd(true)}
              className="cursor-pointer px-5 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600"
            >
              + Add Question
            </button>
            <button
              onClick={() => setShowModalShare(true)}
              className="cursor-pointer px-5 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
            >
              <div className="flex items-center gap-1">
                <MdOutlineShare /> Share
              </div>
            </button>
          </div>
        </div>
      )}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={(layout) => handleLayoutChange(layout)}
        isDraggable={!isEmbedMode}
        isResizable={!isEmbedMode}
      >
        {dashboard.questions.map((q) => (
          <div key={q.id.toString()}>
            <ChartWidget
              questionId={q.id}
              onRemove={() => handleRemoveWidget(q.id)}
              isEmbedMode={isEmbedMode}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      <ModalDashboardShare
        dashboardId={id}
        showModal={showModalShare}
        setShowModal={setShowModalShare}
      />
      <ModalAddQuestion
        dashboardId={id}
        showModal={showModalAdd}
        setShowModal={setShowModalAdd}
        onQuestionAdded={handleQuestionAdded}
        existingQuestionIds={existingQuestionIds}
      />
    </div>
  );
}
