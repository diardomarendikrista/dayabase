// pages/QuestionViewPage/index.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { API } from "axios/axios";
import BackButton from "components/molecules/BackButton";
import Button from "components/atoms/Button";
import { FaFileExcel } from "react-icons/fa";
import ChartRenderer from "components/organisms/ChatRenderer";

export default function QuestionViewPage() {
  const { id, token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isEmbedMode = location.pathname.includes("/embed/");
  const questionId = id;

  const [question, setQuestion] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const pivotTableRef = useRef(null);

  // Extract parameters from URL query string
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const extracted = {};
    for (const [key, value] of params.entries()) {
      extracted[key] = value;
    }
    return extracted;
  }, [location.search]);

  useEffect(() => {
    const loadQuestionAndRunQuery = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let qDetails;

        if (isEmbedMode && token) {
          // PUBLIC MODE: Use public endpoints with token
          const qResponse = await API.get(
            `/api/public/dashboards/${token}/questions/${questionId}`
          );
          qDetails = qResponse.data;

          const queryResponse = await API.post(
            `/api/public/dashboards/${token}/questions/${questionId}/run`,
            { parameters: queryParams }
          );

          setResults(queryResponse.data || []);
        } else {
          // AUTHENTICATED MODE: Use protected endpoints
          const qResponse = await API.get(`/api/questions/${questionId}`);
          qDetails = qResponse.data;

          const queryResponse = await API.post("/api/query/run", {
            sql: qDetails.sql_query,
            connectionId: qDetails.connection_id,
            parameters: queryParams,
          });

          setResults(queryResponse.data || []);
        }

        setQuestion(qDetails);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Failed to load question.";
        setError(errorMessage);
        console.error("Question view error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionAndRunQuery();
  }, [questionId, token, queryParams, isEmbedMode]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center ${isEmbedMode ? "h-screen bg-gray-50" : "h-96"}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center ${isEmbedMode ? "h-screen bg-gray-50" : "h-96"}`}
      >
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 rounded-lg p-6">
            <p className="text-red-700 text-lg font-semibold mb-2">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!question || results.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${isEmbedMode ? "h-screen bg-gray-50" : "h-96"}`}
      >
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const isPivotOrTable =
    question.chart_type === "pivot" || question.chart_type === "table";

  const handleBack = () => {
    if (isEmbedMode && token) {
      navigate(`/embed/dashboards/${token}`);
    } else {
      navigate(-1);
    }
  };

  // Wrapper classes based on mode
  const wrapperClass = isEmbedMode ? "w-full min-h-screen bg-gray-50 py-8" : "";

  const containerClass = isEmbedMode
    ? "mx-auto px-4"
    : "max-w-7xl mx-auto";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton
              onClick={handleBack}
              title={isEmbedMode ? "Back to Dashboard" : "Back"}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {question.name}
              </h1>

              {/* Parameter badges */}
              {Object.keys(queryParams).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(queryParams).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      <span className="font-medium">{key}:</span>
                      <span className="ml-1">{value}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export button for pivot/table */}
          {isPivotOrTable && (
            <Button
              size="sm"
              variant="success"
              onClick={() => pivotTableRef.current?.exportToExcel()}
            >
              <FaFileExcel className="mr-2" /> Export to Excel
            </Button>
          )}
        </div>

        {/* Chart Content */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {isPivotOrTable ? "Results" : "Visualization"}
          </h3>

          <div style={{ height: isPivotOrTable ? "600px" : "500px" }}>
            <ChartRenderer
              ref={pivotTableRef}
              chartType={question.chart_type}
              data={results}
              chartConfig={question.chart_config}
              savedState={question.chart_config}
              isDashboard={false}
              clickBehavior={question.click_behavior}
              width={isPivotOrTable ? undefined : 900}
              height={isPivotOrTable ? undefined : 500}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
