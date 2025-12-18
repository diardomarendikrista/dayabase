// pages/DashboardEditorPage/ChartWidget.jsx
import { useState, useEffect, useRef } from "react";
import { API } from "axios/axios";
import { Link, useParams } from "react-router-dom";
import useMeasure from "react-use-measure";
import ChartRenderer from "components/organisms/ChatRenderer";
import Button from "components/atoms/Button";
import { cn } from "lib/utils";
import { MdDragIndicator, MdEdit } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { FaFileExcel } from "react-icons/fa";
import { RiFilterLine } from "react-icons/ri";

/**
 * ChartWidget
 *
 * @param {string} questionId - id
 * @param {Object} filterParameters - fill with filter parameters
 * @param {Function} onRemove - handle delete chart
 * @param {Function} onOpenFilterMapping - handle open filter mapping (for pivot table drill down)
 * @param {Function} isEmbedMode - Mode public
 */
export default function ChartWidget({
  questionId,
  filterParameters = {},
  onRemove,
  onOpenFilterMapping,
  isEmbedMode,
}) {
  const { token } = useParams();

  const [question, setQuestion] = useState(null);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const pivotTableRef = useRef(null);
  const [ref, { width, height }] = useMeasure();

  useEffect(() => {
    const loadAndRunQuestion = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let qDetails;

        if (isEmbedMode && token) {
          // Public endpoint
          const qResponse = await API.get(
            `/api/public/dashboards/${token}/questions/${questionId}`
          );
          qDetails = qResponse.data;

          const queryResponse = await API.post(
            `/api/public/dashboards/${token}/questions/${questionId}/run`,
            { parameters: filterParameters }
          );

          setResults(queryResponse.data || []);
        } else {
          // Authenticated endpoint
          const qResponse = await API.get(`/api/questions/${questionId}`);
          qDetails = qResponse.data;

          const queryResponse = await API.post("/api/query/run", {
            sql: qDetails.sql_query,
            connectionId: qDetails.connection_id,
            parameters: filterParameters,
          });

          setResults(queryResponse.data || []);
        }

        setQuestion(qDetails);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load widget data.");
        console.error("Widget error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAndRunQuestion();
  }, [questionId, filterParameters, isEmbedMode, token]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-red-500">{error}</p>
        </div>
      );
    }

    if (!question) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-gray-500">
            No question data available.
          </p>
        </div>
      );
    }

    if (width < 50 || height < 50) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-gray-400 text-sm">Adjusting size...</p>
        </div>
      );
    }

    const headerHeight = 40;
    const padding = 24;

    return (
      <ChartRenderer
        ref={pivotTableRef}
        chartType={question.chart_type}
        data={results}
        chartConfig={question.chart_config}
        savedState={question.chart_config}
        isDashboard={true}
        clickBehavior={question.click_behavior}
        width={width - padding}
        height={height - headerHeight - padding}
      />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 h-full w-full flex flex-col relative group overflow-hidden">
      {/* HEADER */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 flex-shrink-0 widget-drag-handle",
          "rounded-t-lg border-b border-gray-100",
          {
            "cursor-move bg-gradient-to-r from-gray-50 to-gray-100":
              !isEmbedMode,
            "bg-gray-100": isEmbedMode,
          }
        )}
      >
        <h3 className="font-bold text-sm truncate flex-1 pointer-events-none select-none">
          {question?.name || "Loading..."}
        </h3>

        <div className="flex items-center gap-1">
          {!isEmbedMode && (
            <Link
              to={`/questions/${questionId}`}
              target="_blank"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              className={cn(
                "inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors",
                "text-gray-500",
                "hover:bg-amber-100 hover:text-amber-700"
              )}
              title="Edit Question"
            >
              <MdEdit />
            </Link>
          )}

          {(question?.chart_type === "pivot" ||
            question?.chart_type === "table") && (
            <Button
              variant="ghost" // Gunakan variant ghost agar transparan
              size="icon" // Gunakan size icon (biasanya h-9 w-9 atau sesuaikan)
              className="h-8 w-8 rounded-full text-gray-500 hover:bg-green-100 hover:text-green-700"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                pivotTableRef.current?.exportToExcel();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Export to Excel"
              style={{ pointerEvents: "auto" }}
            >
              <FaFileExcel />
            </Button>
          )}

          {!isEmbedMode && onOpenFilterMapping && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-gray-500 hover:bg-blue-100 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onOpenFilterMapping();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Configure Filter Mappings"
              style={{ pointerEvents: "auto" }}
            >
              <RiFilterLine />
            </Button>
          )}

          {!isEmbedMode && onRemove && (
            <>
              <div className="text-gray-400 pointer-events-none ml-1">
                <MdDragIndicator />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onRemove();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-8 w-8 bg-gray-200 rounded-full text-gray-600 hover:bg-red-500 hover:text-white"
                title="Remove from Dashboard"
                style={{ pointerEvents: "auto" }}
              >
                <IoMdClose />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div
        ref={ref}
        className="flex-1 min-h-0 w-full relative"
        style={{ pointerEvents: "auto", userSelect: "auto" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-3 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
