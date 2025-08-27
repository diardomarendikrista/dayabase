import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { API } from "axios/axios";
import { Responsive, WidthProvider } from "react-grid-layout";
import ChartWidget from "./ChartWidget";
import ModalDashboardShare from "./ModalDashboardShare";
import ModalAddQuestion from "./ModalAddQuestion";
import { MdOutlineShare, MdRedo, MdSave, MdUndo } from "react-icons/md";
import { addToast } from "store/slices/toastSlice";
import { useDispatch } from "react-redux";
import Input from "components/atoms/Input";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardViewPage() {
  const { id, token } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const isEmbedMode = location.pathname.includes("/embed/");
  const dashboardIdentifier = id || token;

  const [dashboard, setDashboard] = useState(null);
  const [dashboardName, setDashboardName] = useState("");

  const [layoutHistory, setLayoutHistory] = useState([]);
  const [currentLayoutIndex, setCurrentLayoutIndex] = useState(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showModalShare, setShowModalShare] = useState(false);
  const [showModalAdd, setShowModalAdd] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!dashboardIdentifier) return;
    setIsLoading(true);
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
      setLayoutHistory([initialLayout]);
      setCurrentLayoutIndex(0);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Gagal mengambil data dashboard", error);
      setDashboard(null);
    } finally {
      setIsLoading(false);
    }
  }, [dashboardIdentifier, isEmbedMode]);

  const handleRenameDashboard = async () => {
    if (isEmbedMode) return;
    if (dashboard && dashboardName && dashboardName !== dashboard.name) {
      try {
        await API.put(`/api/dashboards/${id}`, {
          name: dashboardName,
          description: dashboard.description,
        });
        setDashboard((prev) => ({ ...prev, name: dashboardName }));
        dispatch(addToast({ message: "Dashboard renamed.", type: "success" }));
      } catch (error) {
        setDashboardName(dashboard.name);
        dispatch(
          addToast({ message: "Failed to save new name.", type: "error" })
        );
      }
    }
  };

  const pushToHistory = (newLayout, newQuestions) => {
    const newHistory = layoutHistory.slice(0, currentLayoutIndex + 1);
    newHistory.push(newLayout);

    setLayoutHistory(newHistory);
    setCurrentLayoutIndex(newHistory.length - 1);
    setHasUnsavedChanges(true);

    if (newQuestions) {
      setDashboard((prev) => ({ ...prev, questions: newQuestions }));
    }
  };

  const handleUndo = () => {
    if (currentLayoutIndex > 0) {
      setCurrentLayoutIndex(currentLayoutIndex - 1);
      setHasUnsavedChanges(true);
    }
  };

  const handleRedo = () => {
    if (currentLayoutIndex < layoutHistory.length - 1) {
      setCurrentLayoutIndex(currentLayoutIndex + 1);
      setHasUnsavedChanges(true);
    }
  };

  const handleSaveLayout = async () => {
    if (!hasUnsavedChanges || isEmbedMode) return;
    setIsSaving(true);
    const currentLayout = layoutHistory[currentLayoutIndex];
    try {
      await API.put(`/api/dashboards/${id}/layout`, currentLayout);
      setHasUnsavedChanges(false);
      dispatch(
        addToast({ message: "Layout saved successfully!", type: "success" })
      );
    } catch (error) {
      console.error("Failed to save layout", error);
      dispatch(addToast({ message: "Failed to save layout.", type: "error" }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveQuestion = async (questionIdToRemove) => {
    if (isEmbedMode) return;
    try {
      await API.delete(`/api/dashboards/${id}/questions/${questionIdToRemove}`);

      const currentLayout = layoutHistory[currentLayoutIndex];
      const newLayout = currentLayout.filter(
        (item) => item.i !== questionIdToRemove.toString()
      );
      const newQuestions = dashboard.questions.filter(
        (q) => q.id !== questionIdToRemove
      );

      pushToHistory(newLayout, newQuestions);

      dispatch(
        addToast({
          message: "Question removed from dashboard.",
          type: "success",
        })
      );
    } catch (error) {
      dispatch(
        addToast({ message: "Failed to remove widget.", type: "error" })
      );
    }
  };

  const handleQuestionAdded = (newQuestionData) => {
    const currentLayout = layoutHistory[currentLayoutIndex];

    const newLayoutItem = {
      ...newQuestionData.layout,
      i: newQuestionData.id.toString(),
    };
    const newLayout = [...currentLayout, newLayoutItem];
    const newQuestions = [...dashboard.questions, newQuestionData];

    pushToHistory(newLayout, newQuestions);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) return <p>Loading dashboard...</p>;
  if (!dashboard) return <p>Dashboard not found.</p>;

  const currentLayout = layoutHistory[currentLayoutIndex] || [];
  const existingQuestionIds = currentLayout.map((item) => parseInt(item.i, 10));

  const canUndo = currentLayoutIndex > 0;
  const canRedo = currentLayoutIndex < layoutHistory.length - 1;

  return (
    <div>
      {!isEmbedMode && (
        <div className="flex justify-between items-center mb-6">
          <Input
            type="text"
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            onBlur={handleRenameDashboard}
            className="text-3xl font-bold bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-md p-1 -m-1"
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-2 rounded-md disabled:text-gray-300 hover:bg-gray-100"
            >
              <MdUndo />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 rounded-md disabled:text-gray-300 hover:bg-gray-100"
            >
              <MdRedo />
            </button>
            <button
              onClick={handleSaveLayout}
              disabled={!hasUnsavedChanges || isSaving}
              className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center gap-2"
            >
              <MdSave /> {isSaving ? "Saving..." : "Save"}
            </button>
            <div className="border-l h-6 mx-2"></div>
            <button
              onClick={() => setShowModalAdd(true)}
              className="px-4 py-2 text-sm bg-green-500 text-white font-semibold rounded-md hover:bg-green-600"
            >
              + Add Question
            </button>
            <button
              onClick={() => setShowModalShare(true)}
              className="px-4 py-2 text-sm bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 flex items-center gap-1"
            >
              <MdOutlineShare /> Share
            </button>
          </div>
        </div>
      )}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: currentLayout }} // PERBAIKAN: Gunakan `layout` prop, bukan `layouts`
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onDragStop={(layout) => pushToHistory(layout)}
        onResizeStop={(layout) => pushToHistory(layout)}
        isDraggable={!isEmbedMode}
        isResizable={!isEmbedMode}
      >
        {dashboard.questions
          .filter((q) => existingQuestionIds.includes(q.id)) // Hanya render question yang ada di layout saat ini
          .map((q) => (
            <div key={q.id.toString()}>
              <ChartWidget
                questionId={q.id}
                onRemove={() => handleRemoveQuestion(q.id)}
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
        collectionId={dashboard?.collection_id}
      />
    </div>
  );
}
