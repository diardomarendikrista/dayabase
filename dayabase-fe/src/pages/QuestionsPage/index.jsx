import { API } from "axios/axios";
import ModalAddToDashboard from "components/organisms/ModalAddToDashboard";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function QuestionsListPage() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  const openAddToDashboardModal = (id) => {
    setSelectedQuestionId(id);
    setIsModalOpen(true);
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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await API.delete(`/api/questions/${id}`);
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      } catch (err) {
        alert("Failed to delete question.");
      }
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
                {/* Tombol Baru */}
                <button
                  onClick={() => openAddToDashboardModal(q.id)}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  + Add to Dashboard
                </button>
                <button
                  onClick={() => {
                    handleDelete(q.id);
                  }}
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

      {isModalOpen && (
        <ModalAddToDashboard
          questionId={selectedQuestionId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
