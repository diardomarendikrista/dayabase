import { useState, useEffect } from "react";
import { API } from "axios/axios";
import Modal from "components/molecules/Modal";
import { useDispatch } from "react-redux";
import { addToast } from "store/slices/toastSlice";

export default function ModalAddToDashboard({
  questionId,
  showModal,
  setShowModal,
}) {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchDashboards = async () => {
      const response = await API.get("/api/dashboards");
      setDashboards(response.data);
      if (response.data.length > 0) {
        setSelectedDashboardId(response.data[0].id);
      }
    };
    fetchDashboards();
  }, []);

  const handleSubmit = async () => {
    if (!selectedDashboardId) {
      dispatch(
        addToast({ message: "Please select a dashboard first.", type: "error" })
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await API.post(`/api/dashboards/${selectedDashboardId}/questions`, {
        question_id: questionId,
      });
      dispatch(
        addToast({
          message: "Question has been successfully added to the dashboard!",
          type: "success",
        })
      );
      setShowModal(false);
    } catch (error) {
      dispatch(addToast({ message: "Failed to add question.", type: "error" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add to Dasboard"
      showModal={showModal}
      setShowModal={setShowModal}
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Dashboard
        </label>
        <select
          value={selectedDashboardId}
          onChange={(e) => setSelectedDashboardId(e.target.value)}
          className="w-full rounded-md border-gray-300"
        >
          {dashboards.map((d) => (
            <option
              key={d.id}
              value={d.id}
            >
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-gray-200 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300"
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
    </Modal>
  );
}
