import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { API } from "axios/axios";
import { Responsive, WidthProvider } from "react-grid-layout";
import ChartWidget from "./ChartWidget";
import ModalDashboardShare from "./ModalDashboardShare";
import ModalAddQuestion from "./ModalAddQuestion";
import { MdOutlineShare, MdRedo, MdSave, MdUndo } from "react-icons/md";
import { RiAddLine } from "react-icons/ri";
import { addToast } from "store/slices/toastSlice";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardViewPage() {
  const { id, token } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const isEmbedMode = location.pathname.includes("/embed/");
  const dashboardIdentifier = id || token;

  const [originalDashboard, setOriginalDashboard] = useState(null);
  const [dashboardName, setDashboardName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const [isSaving, setIsSaving] = useState(false);
  const [showModalShare, setShowModalShare] = useState(false);
  const [showModalAdd, setShowModalAdd] = useState(false);

  const pushStateToHistory = (newState) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const fetchDashboardData = useCallback(async () => {
    if (!dashboardIdentifier) return;
    setIsLoading(true);
    const apiUrl = isEmbedMode
      ? `/api/public/dashboards/${dashboardIdentifier}`
      : `/api/dashboards/${dashboardIdentifier}`;
    try {
      const response = await API.get(apiUrl);
      const data = response.data;

      setOriginalDashboard(data);
      setDashboardName(data.name);

      const initialLayout = data.questions.map((q) => ({
        ...q.layout,
        i: q.id.toString(),
      }));

      setHistory([{ questions: data.questions, layout: initialLayout }]);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Gagal mengambil data dashboard", error);
      setHistory([]);
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

  const handleLayoutChange = (newLayout) => {
    if (isEmbedMode) return;
    const currentState = history[currentIndex];
    pushStateToHistory({ ...currentState, layout: newLayout });
  };

  const handleQuestionAdded = (newQuestionDetails) => {
    const currentState = history[currentIndex];
    let nextY = 0;
    if (currentState.layout.length > 0) {
      nextY = Math.max(
        ...currentState.layout.map((l) => (l.y || 0) + (l.h || 0))
      );
    }
    const newLayoutItem = {
      i: newQuestionDetails.id.toString(),
      x: 0,
      y: nextY,
      w: 6,
      h: 5,
    };
    const newState = {
      questions: [...currentState.questions, newQuestionDetails],
      layout: [...currentState.layout, newLayoutItem],
    };
    pushStateToHistory(newState);
  };

  const handleRemoveQuestion = (questionIdToRemove) => {
    if (isEmbedMode) return;
    const currentState = history[currentIndex];
    const newState = {
      questions: currentState.questions.filter(
        (q) => q.id !== questionIdToRemove
      ),
      layout: currentState.layout.filter(
        (item) => item.i !== questionIdToRemove.toString()
      ),
    };
    pushStateToHistory(newState);
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSaveChanges = async () => {
    if (isEmbedMode) return;
    setIsSaving(true);

    const originalState = history[0];
    const currentState = history[currentIndex];

    try {
      const originalQuestionIds = new Set(
        originalState.questions.map((q) => q.id)
      );
      const currentQuestionIds = new Set(
        currentState.questions.map((q) => q.id)
      );

      const removedQuestions = originalState.questions.filter(
        (q) => !currentQuestionIds.has(q.id)
      );
      const addedQuestions = currentState.questions.filter(
        (q) => !originalQuestionIds.has(q.id)
      );

      // Hapus semua widget yang perlu dihapus
      const deletePromises = removedQuestions.map((q) =>
        API.delete(`/api/dashboards/${id}/questions/${q.id}`)
      );
      await Promise.all(deletePromises);

      // Tambahkan semua widget baru
      const addPromises = addedQuestions.map((q) =>
        API.post(`/api/dashboards/${id}/questions`, { question_id: q.id })
      );
      await Promise.all(addPromises);

      //Setelah semua penambahan/penghapusan selesai, simpan layout akhir
      await API.put(`/api/dashboards/${id}/layout`, currentState.layout);

      dispatch(
        addToast({ message: "Dashboard saved successfully!", type: "success" })
      );

      // Ambil data terbaru dari server untuk sinkronisasi
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to save dashboard changes", error);
      dispatch(addToast({ message: "Failed to save changes.", type: "error" }));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) return <p>Loading dashboard...</p>;
  if (history.length === 0 || currentIndex === -1)
    return <p>Dashboard not found or failed to load.</p>;

  const currentState = history[currentIndex];
  const hasUnsavedChanges = history.length > 1;

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return (
    <div>
      {!isEmbedMode && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            <Input
              type="text"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              onBlur={handleRenameDashboard}
              className="text-3xl font-bold bg-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <MdUndo />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo"
            >
              <MdRedo />
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={!hasUnsavedChanges || isSaving}
              size="sm"
            >
              <MdSave className="mr-2 h-4 w-4" />{" "}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <div className="border-l h-6 mx-2"></div>
            <Button
              variant="success"
              onClick={() => setShowModalAdd(true)}
              size="sm"
            >
              <RiAddLine className="mr-2 h-4 w-4" /> Add Question
            </Button>
            <Button
              variant="info"
              onClick={() => setShowModalShare(true)}
              size="sm"
            >
              <MdOutlineShare className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </div>
      )}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: currentState.layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onDragStop={handleLayoutChange}
        onResizeStop={handleLayoutChange}
        isDraggable={!isEmbedMode}
        isResizable={!isEmbedMode}
      >
        {currentState.questions.map((q) => (
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
        existingQuestionIds={currentState.questions.map((q) => q.id)}
        collectionId={originalDashboard?.collection_id}
      />
    </div>
  );
}
