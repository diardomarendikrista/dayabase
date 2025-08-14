import { useState, useEffect, useMemo } from "react";
import { API } from "axios/axios";
import Modal from "components/molecules/Modal";
import { useDispatch } from "react-redux";
import { addToast } from "store/slices/toastSlice";

export default function ModalAddQuestion({
  dashboardId,
  showModal,
  setShowModal,
  onQuestionAdded,
  existingQuestionIds = [],
}) {
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();

  const availableQuestions = useMemo(() => {
    return allQuestions.filter((q) => !existingQuestionIds.includes(q.id));
  }, [allQuestions, existingQuestionIds]);

  const handleSubmit = async () => {
    if (!selectedQuestionId) {
      dispatch(
        addToast({ message: "Please select a question first.", type: "error" })
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await API.post(`/api/dashboards/${dashboardId}/questions`, {
        question_id: selectedQuestionId,
      });
      dispatch(
        addToast({
          message: "Question successfully added to dashboard!",
          type: "success",
        })
      );
      onQuestionAdded(); // Notify parent to refresh data
      setShowModal(false);
    } catch (error) {
      dispatch(addToast({ message: "Failed to add question.", type: "error" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (availableQuestions.length > 0) {
      setSelectedQuestionId(availableQuestions[0].id);
    } else {
      setSelectedQuestionId(""); // Empty if no options
    }
  }, [availableQuestions]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await API.get("/api/questions");
        setAllQuestions(response.data);
      } catch (error) {
        console.error("Failed to fetch questions list", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  return (
    <Modal
      title="Add Question to Dashboard"
      showModal={showModal}
      setShowModal={setShowModal}
    >
      {isLoading ? (
        <p>Loading questions list...</p>
      ) : availableQuestions.length > 0 ? (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Question
            </label>
            <select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              {availableQuestions.map((q) => (
                <option
                  key={q.id}
                  value={q.id}
                >
                  {q.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-200 rounded-md font-semibold text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md disabled:bg-indigo-300 hover:bg-indigo-700"
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      ) : (
        <p>No questions available to add.</p>
      )}
    </Modal>
  );
}
