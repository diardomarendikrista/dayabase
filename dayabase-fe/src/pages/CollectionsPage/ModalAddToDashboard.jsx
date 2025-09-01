import { useState, useEffect, useMemo } from "react";
import { API } from "axios/axios";
import Modal from "components/molecules/Modal";
import { useDispatch } from "react-redux";
import { addToast } from "store/slices/toastSlice";
import Button from "components/atoms/Button";
import Select from "components/atoms/Select";

export default function ModalAddToDashboard({
  questionId,
  showModal,
  setShowModal,
  collectionId,
}) {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();

  const dashboardOptions = useMemo(() => {
    return dashboards.map((d) => ({ value: d.id, label: d.name }));
  }, [dashboards]);

  useEffect(() => {
    const fetchDashboards = async () => {
      const response = await API.get(
        `/api/dashboards?collectionId=${collectionId}`
      );
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
        <Select
          value={selectedDashboardId}
          onChange={(value) => setSelectedDashboardId(value)}
          options={dashboardOptions}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => setShowModal(false)}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="min-w-20"
        >
          {isSubmitting ? "Adding..." : "Add"}
        </Button>
      </div>
    </Modal>
  );
}
