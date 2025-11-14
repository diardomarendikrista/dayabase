// pages/QuestionViewPage/index.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { API } from "axios/axios";
import BackButton from "components/molecules/BackButton";
import BarChart from "components/organisms/charts/BarChart";
import LineChart from "components/organisms/charts/LineChart";
import DonutChart from "components/organisms/charts/DonutChart";
import PivotTable from "components/organisms/charts/PivotTable";
import { FaFileExcel } from "react-icons/fa";
import Button from "components/atoms/Button";

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
        const qResponse = await API.get(`/api/questions/${id}`);
        const qDetails = qResponse.data;
        setQuestion(qDetails);

        const queryResponse = await API.post("/api/query/run", {
          sql: qDetails.sql_query,
          connectionId: qDetails.connection_id,
          parameters: queryParams,
        });

        if (queryResponse.data && queryResponse.data.length > 0) {
          setResults(queryResponse.data);
        } else {
          setResults([]);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load question.");
        console.error("Question view error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionAndRunQuery();
  }, [id, queryParams]);

  // Transform data for charts
  const transformedData = useMemo(() => {
    if (!question || !question.chart_config || results.length === 0)
      return null;

    const { category, value, values } = question.chart_config;
    if (!category) return null;

    // Pie chart
    if (question.chart_type === "pie") {
      if (!value) return null;
      return {
        seriesData: results.map((row) => ({
          name: row[category],
          value: row[value],
        })),
      };
    }

    // Bar/Line chart
    const valueColumns = values || (value ? [value] : null);
    if (
      !valueColumns ||
      !Array.isArray(valueColumns) ||
      valueColumns.length === 0
    ) {
      return null;
    }

    return {
      xAxisData: results.map((row) => row[category]),
      seriesData: valueColumns.map((valueColumn) => ({
        name: valueColumn,
        data: results.map((row) => row[valueColumn]),
      })),
    };
  }, [results, question]);

  const renderChart = () => {
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

    const chartType = question.chart_type;

    // Pivot/Table
    if (chartType === "pivot" || chartType === "table") {
      return (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Results</h3>
            <Button
              size="sm"
              variant="success"
              onClick={() => pivotTableRef.current?.exportToExcel()}
            >
              <FaFileExcel className="mr-2" /> Export to Excel
            </Button>
          </div>
          <div className="h-[600px]">
            <PivotTable
              ref={pivotTableRef}
              data={results}
              savedState={question.chart_config}
              isDashboard={false}
              clickBehavior={question.click_behavior}
              onRowClick={(row, targetUrl) => {
                // Navigate in same window (user can use browser back)
                navigate(targetUrl);
              }}
            />
          </div>
        </div>
      );
    }

    // Charts
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Visualization
        </h3>
        <div className="h-[500px] flex items-center justify-center">
          {chartType === "bar" && transformedData && (
            <BarChart
              xAxisData={transformedData.xAxisData}
              seriesData={transformedData.seriesData}
              width={900}
              height={500}
            />
          )}
          {chartType === "line" && transformedData && (
            <LineChart
              xAxisData={transformedData.xAxisData}
              seriesData={transformedData.seriesData}
              width={900}
              height={500}
            />
          )}
          {chartType === "pie" && transformedData && (
            <DonutChart
              seriesData={transformedData.seriesData}
              width={500}
              height={500}
            />
          )}
        </div>
      </div>
    );
  };

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
              {question?.name || "Loading..."}
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
      </div>

      {/* Chart/Table Content */}
      <div>{renderChart()}</div>
    </div>
  );
}
