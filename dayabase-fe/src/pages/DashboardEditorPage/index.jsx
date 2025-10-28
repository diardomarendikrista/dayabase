// pages/DashboardEditorPage/index.jsx
import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { API } from "axios/axios";
import { Responsive, WidthProvider } from "react-grid-layout";
import ChartWidget from "./ChartWidget";
import FilterPanel from "./FilterPanel";
import ModalDashboardShare from "./ModalDashboardShare";
import ModalAddQuestion from "./ModalAddQuestion";
import ModalFilterMapping from "./ModalFilterMapping";
import { MdOutlineShare, MdRedo, MdSave, MdUndo } from "react-icons/md";
import { RiAddLine } from "react-icons/ri";
import { addToast } from "store/slices/toastSlice";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";
import BackButton from "components/molecules/BackButton";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardViewPage() {
  const { id, token } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const isEmbedMode = location.pathname.includes("/embed/");
  const dashboardIdentifier = id || token;

  const [dashboardName, setDashboardName] = useState("");
  const [dataDashboard, setDataDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState([]);
  const [filterValues, setFilterValues] = useState({});

  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [savedIndex, setSavedIndex] = useState(-1);

  const [isSaving, setIsSaving] = useState(false);
  const [showModalShare, setShowModalShare] = useState(false);
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [showModalFilterMapping, setShowModalFilterMapping] = useState(false);
  const [selectedQuestionForMapping, setSelectedQuestionForMapping] =
    useState(null);

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

      console.log("Dashboard data:", data);

      setDashboardName(data.name);
      setDataDashboard(data);
      setFilters(data.filters || []); // Set filters dari backend

      const initialLayout = data.questions.map((q) => ({
        ...q.layout,
        i: q?.instance_id?.toString(),
      }));

      const initialState = {
        questions: data.questions,
        layout: initialLayout,
        name: data.name,
      };
      setHistory([initialState]);
      setCurrentIndex(0);
      setSavedIndex(0);
    } catch (error) {
      console.error("Gagal mengambil data dashboard", error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [dashboardIdentifier, isEmbedMode]);

  const handleLayoutChange = (newLayout) => {
    if (isEmbedMode) return;
    const currentState = history[currentIndex];
    if (JSON.stringify(currentState.layout) !== JSON.stringify(newLayout)) {
      pushStateToHistory({ ...currentState, layout: newLayout });
    }
  };

  const handleQuestionAdded = (newQuestionDetails) => {
    const currentState = history[currentIndex];
    const instanceId = `temp_${newQuestionDetails.id}_${Date.now()}`;

    let nextY = 0;
    if (currentState.layout.length > 0) {
      nextY = Math.max(
        ...currentState.layout.map((l) => (l.y || 0) + (l.h || 0))
      );
    }

    const newLayoutItem = { i: instanceId, x: 0, y: nextY, w: 12, h: 10 };
    const newQuestionInstance = {
      ...newQuestionDetails,
      instance_id: instanceId,
      filter_mappings: {}, // Initialize empty mappings
    };

    const newState = {
      ...currentState,
      questions: [...currentState.questions, newQuestionInstance],
      layout: [...currentState.layout, newLayoutItem],
    };
    pushStateToHistory(newState);
  };

  const handleRemoveQuestion = (instanceIdToRemove) => {
    if (isEmbedMode) return;
    const currentState = history[currentIndex];
    const newState = {
      ...currentState,
      questions: currentState.questions.filter(
        (q) => q.instance_id.toString() !== instanceIdToRemove
      ),
      layout: currentState.layout.filter(
        (item) => item.i !== instanceIdToRemove
      ),
    };
    pushStateToHistory(newState);
  };

  const handleUndo = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) setCurrentIndex(currentIndex + 1);
  };

  // Handler untuk membuka modal filter mapping
  const handleOpenFilterMapping = (questionInstance) => {
    console.log("Opening filter mapping for:", questionInstance);
    setSelectedQuestionForMapping(questionInstance);
    setShowModalFilterMapping(true);
  };

  // Handler setelah filter mappings disimpan
  const handleFilterMappingsSaved = (newMappings) => {
    console.log("Filter mappings saved:", newMappings);

    // Update question's filter_mappings dalam state
    const currentState = history[currentIndex];
    const updatedQuestions = currentState.questions.map((q) =>
      q.instance_id === selectedQuestionForMapping.instance_id
        ? { ...q, filter_mappings: newMappings }
        : q
    );

    pushStateToHistory({
      ...currentState,
      questions: updatedQuestions,
    });

    dispatch(
      addToast({
        message: "Filter mappings updated in dashboard state",
        type: "success",
      })
    );
  };

  const handleSaveChanges = async () => {
    if (isEmbedMode) return;
    setIsSaving(true);

    const lastSavedState = history[savedIndex];
    let currentState = { ...history[currentIndex] };

    const nameHasChanged = dashboardName !== lastSavedState.name;

    try {
      if (nameHasChanged) {
        await API.put(`/api/dashboards/${id}`, { name: dashboardName });
      }

      const currentInstanceIds = new Set(
        currentState.questions.map((q) => q.instance_id.toString())
      );
      const removedInstances = lastSavedState.questions.filter(
        (q) => !currentInstanceIds.has(q.instance_id.toString())
      );
      const addedInstances = currentState.questions.filter((q) =>
        q.instance_id.toString().startsWith("temp_")
      );

      const deletePromises = removedInstances.map((q) =>
        API.delete(`/api/dashboards/${id}/questions/${q.instance_id}`)
      );
      await Promise.all(deletePromises);

      const addPromises = addedInstances.map((q) =>
        API.post(`/api/dashboards/${id}/questions`, { question_id: q.id })
      );
      const newItemsFromBackend = await Promise.all(addPromises);

      const tempIdToRealIdMap = new Map();
      newItemsFromBackend.forEach((newItem, index) => {
        const oldTempId = addedInstances[index].instance_id;
        tempIdToRealIdMap.set(oldTempId, newItem.data.instance_id.toString());
      });

      currentState.questions = currentState.questions.map((q) => {
        const realId = tempIdToRealIdMap.get(q.instance_id);
        return realId ? { ...q, instance_id: realId } : q;
      });
      currentState.layout = currentState.layout.map((l) => {
        const realId = tempIdToRealIdMap.get(l.i);
        return realId ? { ...l, i: realId } : l;
      });

      await API.put(`/api/dashboards/${id}/layout`, currentState.layout);

      dispatch(
        addToast({ message: "Dashboard saved successfully!", type: "success" })
      );

      let finalHistory = history.slice(0, currentIndex + 1);

      if (nameHasChanged) {
        finalHistory = finalHistory.map((h) => ({
          ...h,
          name: dashboardName,
        }));
      }

      finalHistory[currentIndex] = {
        ...currentState,
        name: dashboardName,
      };

      setHistory(finalHistory);
      setSavedIndex(currentIndex);
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
    return (
      <div className="text-center">
        <p>Dashboard not found or failed to load.</p>
      </div>
    );

  const currentState = history[currentIndex];
  const hasUnsavedChanges =
    currentIndex !== savedIndex || dashboardName !== currentState?.name;

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return (
    <div>
      {!isEmbedMode && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex px-2">
            <BackButton
              to={`/collections/${dataDashboard?.collection_id}`}
              title={`Back to ${dataDashboard?.collection_name}`}
            />
          </div>
          <div className="flex-1">
            <form
              autoComplete="off"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                className="text-3xl font-bold bg-transparent"
              />
            </form>
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

      {/* FILTER PANEL */}
      <FilterPanel
        dashboardId={id}
        filters={filters}
        onFiltersChange={setFilters}
        filterValues={filterValues}
        onFilterValuesChange={setFilterValues}
        isEmbedMode={isEmbedMode}
      />

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: currentState.layout }}
        breakpoints={{ lg: 1100, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 }}
        rowHeight={30}
        onDragStop={handleLayoutChange}
        onResizeStop={handleLayoutChange}
        isDraggable={!isEmbedMode}
        isResizable={!isEmbedMode}
      >
        {currentState.questions.map((q) => (
          <div key={q?.instance_id?.toString()}>
            <ChartWidget
              questionId={q.id}
              filterParameters={filterValues}
              onRemove={() => handleRemoveQuestion(q.instance_id.toString())}
              onOpenFilterMapping={() => handleOpenFilterMapping(q)}
              isEmbedMode={isEmbedMode}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      {!isEmbedMode && (
        <>
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
            currentCollectionId={dataDashboard?.collection_id}
          />
          <ModalFilterMapping
            showModal={showModalFilterMapping}
            setShowModal={setShowModalFilterMapping}
            dashboardId={id}
            questionInstance={selectedQuestionForMapping}
            availableFilters={filters}
            onMappingsSaved={handleFilterMappingsSaved}
          />
        </>
      )}
    </div>
  );
}
