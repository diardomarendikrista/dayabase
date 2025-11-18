// pages/DashboardEditorPage/ModalFilterMapping.jsx
import { useState, useEffect, useMemo } from "react";
import Modal from "components/molecules/Modal";
import Button from "components/atoms/Button";
import Select from "components/atoms/Select";
import { API } from "axios/axios";
import { useDispatch } from "react-redux";
import { addToast } from "store/slices/toastSlice";

/**
 * ModalFilterMapping
 *
 * @param {boolean} showModal - flag to open this modal
 * @param {Function} setShowModal - function to open/close this modal
 * @param {string} dashboardId - id
 * @param {Object} questionInstance - question
 * @param {Function} availableFilters - filters for this question
 * @param {Function} onMappingsSaved - handle after save, do something
 */
export default function ModalFilterMapping({
  showModal,
  setShowModal,
  dashboardId,
  questionInstance,
  availableFilters,
  onMappingsSaved,
}) {
  const [questionDetails, setQuestionDetails] = useState(null); // belum dipake, lupa kemarin mau diapain :')
  const [columns, setColumns] = useState([]);
  const [mappings, setMappings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const dispatch = useDispatch();

  // Fetch question details dan run query untuk mendapat columns
  useEffect(() => {
    if (!showModal || !questionInstance) return;

    const fetchQuestionAndColumns = async () => {
      setIsLoading(true);
      try {
        // Get question details
        const qResponse = await API.get(
          `/api/questions/${questionInstance.id}`
        );
        const qDetails = qResponse.data;
        setQuestionDetails(qDetails);

        // Run query to get columns
        const queryResponse = await API.post("/api/query/run", {
          sql: qDetails.sql_query,
          connectionId: qDetails.connection_id,
          row_limit: 1, // Hanya butuh 1 row untuk tahu kolom
        });

        if (queryResponse.data && queryResponse.data.length > 0) {
          const cols = Object.keys(queryResponse.data[0]);
          setColumns(cols);
        }

        // Load existing mappings
        setMappings(questionInstance.filter_mappings || {});
      } catch (error) {
        console.error("Failed to load question details:", error);
        dispatch(
          addToast({
            message: "Failed to load question details",
            type: "error",
          })
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestionAndColumns();
  }, [showModal, questionInstance, dispatch]);

  const columnOptions = useMemo(() => {
    return [
      { value: "", label: "-- Not mapped --" },
      ...columns.map((col) => ({ value: col, label: col })),
    ];
  }, [columns]);

  const handleMappingChange = (filterId, columnName) => {
    setMappings((prev) => {
      const newMappings = { ...prev };
      if (columnName === "") {
        delete newMappings[filterId];
      } else {
        newMappings[filterId] = columnName;
      }
      return newMappings;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await API.put(
        `/api/dashboards/${dashboardId}/questions/${questionInstance.instance_id}/mappings`,
        mappings
      );

      dispatch(
        addToast({
          message: "Filter mappings saved successfully",
          type: "success",
        })
      );

      if (onMappingsSaved) {
        onMappingsSaved(mappings);
      }

      setShowModal(false);
    } catch (error) {
      dispatch(
        addToast({
          message: "Failed to save filter mappings",
          type: "error",
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={`Filter Mappings: ${questionInstance?.name || "Question"}`}
      showModal={showModal}
      setShowModal={setShowModal}
      closeOnOverlayClick={false}
    >
      {isLoading ? (
        <p>Loading question details...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Map dashboard filters to the columns in this question's query.
          </p>

          {availableFilters.length === 0 ? (
            <p className="text-yellow-600 text-sm">
              No filters available. Add filters to the dashboard first.
            </p>
          ) : (
            availableFilters.map((filter) => (
              <div
                key={filter.id}
                className="space-y-1"
              >
                <label className="block text-sm font-medium text-gray-700">
                  {filter.display_name}
                  <span className="text-gray-500 text-xs ml-1">
                    ({filter.name})
                  </span>
                </label>
                <Select
                  value={mappings[filter.id] || ""}
                  onChange={(value) => handleMappingChange(filter.id, value)}
                  options={columnOptions}
                  placeholder="Select a column"
                />
              </div>
            ))
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || availableFilters.length === 0}
            >
              {isSaving ? "Saving..." : "Save Mappings"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
