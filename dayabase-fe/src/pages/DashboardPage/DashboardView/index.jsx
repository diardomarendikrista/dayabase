import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API } from "axios/axios";
import { Responsive, WidthProvider } from "react-grid-layout";
import ChartWidget from "./ChartWidget";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardViewPage() {
  const isEmbedMode = location.pathname.includes("/embed/");

  const { id } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [layout, setLayout] = useState([]);
  const [dashboardName, setDashboardName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await API.get(`/api/dashboards/${id}`);
        const data = response.data;
        setDashboard(data);
        setDashboardName(data.name);

        // Ubah format layout dari backend agar sesuai dengan react-grid-layout
        const initialLayout = data.questions.map((q) => ({
          ...q.layout,
          i: q.id.toString(), // Pastikan 'i' adalah string
        }));
        setLayout(initialLayout);
      } catch (error) {
        console.error("Gagal mengambil data dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [id]);

  const handleRenameDashboard = async () => {
    if (dashboard && dashboardName && dashboardName !== dashboard.name) {
      try {
        await API.put(`/api/dashboards/${id}`, {
          name: dashboardName,
          description: dashboard.description,
        });
        // Perbarui state utama setelah berhasil
        setDashboard((prev) => ({ ...prev, name: dashboardName }));
      } catch (error) {
        console.error("Gagal mengganti nama dashboard", error);
        // Kembalikan ke nama semula jika gagal
        setDashboardName(dashboard.name);
        alert("Gagal menyimpan nama baru.");
      }
    }
  };

  const handleLayoutChange = async (newLayout) => {
    setLayout(newLayout);
    try {
      await API.put(`/api/dashboards/${id}/layout`, newLayout);
    } catch (error) {
      console.error("Gagal menyimpan layout", error);
    }
  };

  const handleRemoveWidget = async (questionIdToRemove) => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin menghapus chart ini dari dashboard?"
      )
    ) {
      try {
        await API.delete(
          `/api/dashboards/${id}/questions/${questionIdToRemove}`
        );

        // Update state di frontend untuk UI yang instan
        setDashboard((prev) => ({
          ...prev,
          questions: prev.questions.filter((q) => q.id !== questionIdToRemove),
        }));
        setLayout((prev) =>
          prev.filter((l) => l.i !== questionIdToRemove.toString())
        );
      } catch (error) {
        console.error("Gagal menghapus widget dari dashboard", error);
        alert("Gagal menghapus widget.");
      }
    }
  };

  if (isLoading) return <p>Memuat dashboard...</p>;
  if (!dashboard) return <p>Dashboard tidak ditemukan.</p>;

  return (
    <div>
      {isEmbedMode ? (
        <h1 className="text-3xl font-bold mb-6">{dashboard.name}</h1>
      ) : (
        <input
          type="text"
          value={dashboardName}
          onChange={(e) => setDashboardName(e.target.value)}
          onBlur={handleRenameDashboard}
          className="text-3xl font-bold mb-6 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-md p-1 -m-1 w-full"
        />
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
    </div>
  );
}
