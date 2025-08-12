import { API } from "axios/axios";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ModalAddToDashboard from "pages/QuestionsPage/ModalAddToDashboard";
import ConfirmationModal from "components/molecules/ConfirmationModal";

export default function QuestionsListPage() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [modalAddToDashboard, setShowModalAddToDashboard] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const openAddToDashboardModal = (id) => {
    setSelectedQuestionId(id);
    setShowModalAddToDashboard(true);
  };

  const openDeleteModal = (question) => {
    setItemToDelete(question);
    setShowDeleteModal(true);
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const response = await API.get("/api/questions");
        setQuestions(response.data);
      } catch (error) {
        console.error("Failed to fetch questions", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await API.delete(`/api/questions/${itemToDelete.id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== itemToDelete.id));
    } catch (err) {
      alert("Failed to delete question.");
    }
  };
  if (isLoading) return <p>Loading questions...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Questions</h1>
        <Link
          to="/questions/new"
          className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
        >
          Add Question
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {questions.map((q) => (
            <li
              key={q.id}
              className="py-4 flex justify-between items-center"
            >
              <Link
                to={`/questions/${q.id}`}
                className="hover:text-indigo-600"
              >
                <p className="font-bold text-lg">{q.name}</p>
                <p className="text-sm text-gray-500">Type: {q.chart_type}</p>
              </Link>
              <div className="space-x-4">
                <button
                  onClick={() => openAddToDashboardModal(q.id)}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  + Add to Dashboard
                </button>
                <button
                  onClick={() => openDeleteModal(q)}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        {questions.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No questions saved yet.
          </p>
        )}
      </div>

      <ModalAddToDashboard
        questionId={selectedQuestionId}
        showModal={modalAddToDashboard}
        setShowModal={setShowModalAddToDashboard}
      />

      <ConfirmationModal
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        title="Hapus Pertanyaan"
        message={`Apakah Anda yakin ingin menghapus pertanyaan "${itemToDelete?.name}"?`}
        onConfirm={handleDelete}
        confirmText="Ya, Hapus"
        isDestructive={true}
      />
    </div>
  );
}
