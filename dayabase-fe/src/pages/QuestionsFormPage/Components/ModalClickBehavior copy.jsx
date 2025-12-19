// pages/QuestionsFormPage/Components/ModalClickBehavior.jsx
import { useState, useEffect } from "react";
import { API } from "axios/axios";
import Modal from "components/molecules/Modal";
import Button from "components/atoms/Button";
import Select from "components/atoms/Select";
import Input from "components/atoms/Input";
import { useDispatch } from "react-redux";
import { addToast } from "store/slices/toastSlice";

export default function ModalClickBehavior({
  showModal,
  setShowModal,
  questionId,
}) {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [action, setAction] = useState("link_to_question");
  const [targetId, setTargetId] = useState("");
  const [passColumn, setPassColumn] = useState("");
  const [targetParam, setTargetParam] = useState("");

  // Available targets
  const [questions, setQuestions] = useState([]);
  const [dashboards, setDashboards] = useState([]);

  // Action options
  const actionOptions = [
    { value: "link_to_question", label: "Link to Question" },
    { value: "link_to_dashboard", label: "Link to Dashboard" },
  ];

  // Fetch existing config and available targets
  useEffect(() => {
    if (!showModal || !questionId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get current click behavior
        const behaviorRes = await API.get(
          `/api/questions/${questionId}/click-behavior`
        );
        const behavior = behaviorRes.data;

        if (behavior && behavior.enabled) {
          setEnabled(behavior.enabled);
          setAction(behavior.action || "link_to_question");
          setTargetId(behavior.target_id || "");
          setPassColumn(behavior.pass_column || "");
          setTargetParam(behavior.target_param || "");
        } else {
          // Reset to defaults
          setEnabled(false);
          setAction("link_to_question");
          setTargetId("");
          setPassColumn("");
          setTargetParam("");
        }

        // Fetch available questions and dashboards
        const [questionsRes, dashboardsRes] = await Promise.all([
          API.get("/api/questions"),
          API.get("/api/dashboards"),
        ]);

        // Filter out current question from list
        setQuestions(questionsRes.data.filter((q) => q.id !== questionId));
        setDashboards(dashboardsRes.data);
      } catch (error) {
        console.error("Failed to fetch click behavior data:", error);
        dispatch(
          addToast({
            message: "Failed to load click behavior settings",
            type: "error",
          })
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [showModal, questionId, dispatch]);

  const handleSave = async () => {
    // Validation
    if (enabled && !targetId) {
      dispatch(
        addToast({
          message: "Please select a target",
          type: "error",
        })
      );
      return;
    }

    if (enabled && !passColumn) {
      dispatch(
        addToast({
          message: "Please specify which column to pass",
          type: "error",
        })
      );
      return;
    }

    if (enabled && !targetParam) {
      dispatch(
        addToast({
          message: "Please specify target parameter name",
          type: "error",
        })
      );
      return;
    }

    setIsSaving(true);
    try {
      await API.put(`/api/questions/${questionId}/click-behavior`, {
        enabled,
        action: enabled ? action : null,
        target_id: enabled ? targetId : null,
        target_url: null, // Not used in Phase 1
        pass_column: enabled ? passColumn : null,
        target_param: enabled ? targetParam : null,
      });

      dispatch(
        addToast({
          message: "Click behavior saved successfully",
          type: "success",
        })
      );

      setShowModal(false);
    } catch (error) {
      console.error("Failed to save click behavior:", error);
      dispatch(
        addToast({
          message:
            error.response?.data?.message || "Failed to save click behavior",
          type: "error",
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  const targetOptions =
    action === "link_to_question"
      ? questions.map((q) => ({ value: q.id, label: q.name }))
      : dashboards.map((d) => ({ value: d.id, label: d.name }));

  return (
    <Modal
      title="Configure Click Behavior"
      showModal={showModal}
      setShowModal={setShowModal}
      closeOnOverlayClick={false}
    >
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Click behavior currently works for{" "}
              <strong>Pivot Table</strong> view only. When users click a row,
              they will be redirected to the target with the specified
              parameter.
            </p>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
            <input
              type="checkbox"
              id="enable-click"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="enable-click"
              className="font-medium text-gray-900 cursor-pointer"
            >
              Enable click behavior on table rows
            </label>
          </div>

          {enabled && (
            <>
              {/* Action Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <Select
                  value={action}
                  onChange={setAction}
                  options={actionOptions}
                />
              </div>

              {/* Target Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target{" "}
                  {action === "link_to_question" ? "Question" : "Dashboard"}
                </label>
                <Select
                  value={targetId}
                  onChange={setTargetId}
                  options={targetOptions}
                  placeholder={`Select ${action === "link_to_question" ? "question" : "dashboard"}...`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  User will be redirected to this{" "}
                  {action === "link_to_question" ? "question" : "dashboard"}{" "}
                  when clicking a row
                </p>
              </div>

              {/* Pass Column */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Column to Pass
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (from this question's result)
                  </span>
                </label>
                <Input
                  value={passColumn}
                  onChange={(e) => setPassColumn(e.target.value)}
                  placeholder="e.g., id, user_id, customer_id"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This column's value will be passed when user clicks a row
                </p>
              </div>

              {/* Target Parameter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Parameter Name
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (parameter name in target's SQL query)
                  </span>
                </label>
                <Input
                  value={targetParam}
                  onChange={(e) => setTargetParam(e.target.value)}
                  placeholder="e.g., user_id, customer_id"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Target SQL should have:{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                    WHERE column = {`{{${targetParam}}}`}
                  </code>
                </p>
              </div>

              {/* Example Preview */}
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm font-medium text-green-900 mb-2">
                  📋 Example Flow:
                </p>
                <div className="text-xs text-green-800 space-y-1 font-mono">
                  <p>1. User clicks row with {passColumn || "column"}=123</p>
                  <p>
                    2. Navigate to{" "}
                    {action === "link_to_question" ? "Question" : "Dashboard"} #
                    {targetId || "X"}
                  </p>
                  <p>3. Parameter passed: {targetParam || "param"}=123</p>
                  {action === "link_to_question" && (
                    <p className="text-green-700 mt-2">
                      → URL: /questions/{targetId || "X"}?
                      {targetParam || "param"}=123
                    </p>
                  )}
                  {action === "link_to_dashboard" && (
                    <p className="text-green-700 mt-2">
                      → Opens dashboard with filter applied
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
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
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
