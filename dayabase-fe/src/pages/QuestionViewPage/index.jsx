// pages/QuestionViewPage/index.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { API } from "axios/axios";
import BackButton from "components/molecules/BackButton";
import Button from "components/atoms/Button";
import { FaFileExcel } from "react-icons/fa";
import ChartRenderer from "components/organisms/ChatRenderer";

export default function QuestionViewPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

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
        // Get question details
        const qResponse = await API.get(`/api/questions/${id}`);
        const qDetails = qResponse.data;
        setQuestion(qDetails);

        // Run query with URL parameters
        const queryResponse = await API.post("/api/query/run", {
          sql: qDetails.sql_query,
          connectionId: qDetails.connection_id,
          parameters: queryParams,
        });

        setResults(queryResponse.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load question.");
        console.error("Question view error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionAndRunQuery();
  }, [id, queryParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Error</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!question || results.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const isPivotOrTable =
    question.chart_type === "pivot" || question.chart_type === "table";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton
            onClick={() => navigate(-1)}
            title="Back"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {question.name}
            </h1>
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

      {/* Chart Content - SINGLE COMPONENT! 🎉 */}
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
            onRowClick={(row, targetUrl) => navigate(targetUrl)}
            width={isPivotOrTable ? undefined : 900}
            height={isPivotOrTable ? undefined : 500}
          />
        </div>
      </div>
    </div>
  );
}
