import { useState, useEffect, useMemo } from "react";
import { API } from "axios/axios";
import Modal from "components/molecules/Modal";
import { useDispatch, useSelector } from "react-redux";
import { addToast } from "store/slices/toastSlice";
import Button from "components/atoms/Button";
import Select from "components/atoms/Select";

export default function ModalAddQuestion({
  showModal,
  setShowModal,
  onQuestionAdded,
  currentCollectionId,
}) {
  const { items: collections } = useSelector((state) => state.collections);
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [collectionId, setCollectionId] = useState(null);

  const dispatch = useDispatch();

  const questionOptions = useMemo(() => {
    return allQuestions.map((q) => ({ value: q.id, label: q.name }));
  }, [allQuestions]);

  const collectionOptions = useMemo(() => {
    return collections.map((item) => ({ value: item.id, label: item.name }));
  }, [collections]);

  useEffect(() => {
    if (showModal) {
      setIsLoading(true);
      const fetchQuestions = async () => {
        try {
          let apiUrl = "/api/questions";
          apiUrl += `?collectionId=${collectionId ?? currentCollectionId}`;
          const response = await API.get(apiUrl);
          setAllQuestions(response.data);
        } catch (error) {
          console.error("Failed to fetch questions list", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchQuestions();
    }
  }, [showModal, collectionId]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      setSelectedQuestionId(allQuestions[0].id);
    } else {
      setSelectedQuestionId("");
    }
  }, [allQuestions]);

  const handleSubmit = async () => {
    if (!selectedQuestionId) {
      dispatch(
        addToast({ message: "Please select a question first.", type: "error" })
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const fullQuestionDetails = allQuestions.find(
        (q) => q.id === parseInt(selectedQuestionId, 10)
      );
      onQuestionAdded(fullQuestionDetails);
      setShowModal(false);
    } catch (error) {
      dispatch(addToast({ message: "Failed to add question.", type: "error" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add Question to Dashboard"
      showModal={showModal}
      setShowModal={setShowModal}
    >
      {isLoading || allQuestions.length > 0 ? (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Collection
            </label>
            <Select
              value={collectionId || currentCollectionId}
              onChange={(value) => {
                setCollectionId(value);
                setSelectedQuestionId(null);
              }}
              options={collectionOptions}
              defaultValue={currentCollectionId}
              isDisabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Question
            </label>
            <Select
              value={selectedQuestionId}
              onChange={(value) => setSelectedQuestionId(value)}
              options={questionOptions}
              isDisabled={isLoading}
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              onClick={() => setShowModal(false)}
              variant={"outline"}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      ) : (
        <p>No new questions available to add.</p>
      )}
    </Modal>
  );
}
