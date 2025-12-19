// pages/QuestionsFormPage/Components/ModalClickBehavior.jsx
import { useState, useEffect } from "react";
import { API } from "axios/axios";
import Modal from "components/molecules/Modal";
import Button from "components/atoms/Button";
import Select from "components/atoms/Select";
import Input from "components/atoms/Input";
import { useDispatch } from "react-redux";
import { addToast } from "store/slices/toastSlice";
import { RiAddLine, RiDeleteBinLine } from "react-icons/ri"; // Tambah icon delete

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
  const [parameterMappings, setParameterMappings] = useState([
    { passColumn: "", targetParam: "" },
  ]);

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

          if (
            behavior.parameter_mappings &&
            Array.isArray(behavior.parameter_mappings)
          ) {
            setParameterMappings(behavior.parameter_mappings);
          } else {
            setParameterMappings([{ passColumn: "", targetParam: "" }]);
          }
        } else {
          // Reset defaults
          setEnabled(false);
          setAction("link_to_question");
          setTargetId("");
          setParameterMappings([{ passColumn: "", targetParam: "" }]);
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
        console.error("Failed to fetch settings:", error);
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
  }, [showModal, questionId]);

  // --- Helper Functions untuk Dynamic Input ---
  const handleAddMapping = () => {
    setParameterMappings([
      ...parameterMappings,
      { passColumn: "", targetParam: "" },
    ]);
  };

  const handleRemoveMapping = (index) => {
    const newMappings = parameterMappings.filter((_, i) => i !== index);
    setParameterMappings(newMappings);
  };

  const handleMappingChange = (index, field, value) => {
    const newMappings = [...parameterMappings];
    newMappings[index][field] = value;
    setParameterMappings(newMappings);
  };
  // ------------------------------------------

  const handleSave = async () => {
    // Validation
    if (enabled && !targetId) {
      dispatch(addToast({ message: "Please select a target", type: "error" }));
      return;
    }

    // Validasi mapping tidak boleh kosong
    const validMappings = parameterMappings.filter(
      (m) => m.passColumn && m.targetParam
    );

    if (enabled && validMappings.length === 0) {
      dispatch(
        addToast({
          message: "Please add at least one valid parameter mapping",
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

        // Kirim sebagai JSON object/array.
        parameter_mappings: enabled ? validMappings : [],
      });

      dispatch(
        addToast({
          message: "Click behavior saved successfully",
          type: "success",
        })
      );
      setShowModal(false);
    } catch (error) {
      dispatch(addToast({ message: "Failed to save", type: "error" }));
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
        <div className="text-center py-8">Loading...</div>
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
              className="font-medium cursor-pointer"
            >
              Enable click behavior
            </label>
          </div>

          {enabled && (
            <>
              {/* Action & Target Select */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Action Type
                  </label>
                  <Select
                    value={action}
                    onChange={setAction}
                    options={actionOptions}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Target
                  </label>
                  <Select
                    value={targetId}
                    onChange={setTargetId}
                    options={targetOptions}
                    placeholder="Select target..."
                  />
                </div>
              </div>

              {/* DYNAMIC MAPPING SECTION */}
              <div className="border-t pt-4 mt-2">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Parameter Mappings
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Map columns from this question's result to the target's
                  filters/parameters.
                </p>

                <div className="space-y-3">
                  {parameterMappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-end bg-gray-50 p-2 rounded border"
                    >
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 font-medium">
                          Source Column
                        </label>
                        <Input
                          value={mapping.passColumn}
                          onChange={(e) =>
                            handleMappingChange(
                              index,
                              "passColumn",
                              e.target.value
                            )
                          }
                          placeholder="e.g., region_name"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-center justify-center pb-2 text-gray-400">
                        →
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 font-medium">
                          Target Param
                        </label>
                        <Input
                          value={mapping.targetParam}
                          onChange={(e) =>
                            handleMappingChange(
                              index,
                              "targetParam",
                              e.target.value
                            )
                          }
                          placeholder="e.g., region"
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <Button
                        variant="danger"
                        size="icon"
                        className="h-8 w-8 mb-[1px]"
                        onClick={() => handleRemoveMapping(index)}
                        disabled={parameterMappings.length === 1} // Prevent deleting last row
                        title="Remove mapping"
                      >
                        <RiDeleteBinLine />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddMapping}
                    className="w-full border-dashed border-2 hover:border-primary hover:bg-blue-50"
                  >
                    <RiAddLine className="mr-2" /> Add Another Parameter
                  </Button>
                </div>
              </div>

              {/* Preview Logic */}
              <div className="bg-green-50 border border-green-200 rounded-md p-3 text-xs text-green-800 font-mono">
                Example URL: ...?
                {parameterMappings
                  .filter((m) => m.targetParam)
                  .map((m) => `${m.targetParam}=value`)
                  .join("&")}
              </div>
            </>
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
