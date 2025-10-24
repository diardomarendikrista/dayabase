import { useState, useEffect, useMemo, useRef } from "react";
import { API } from "axios/axios";
import useMeasure from "react-use-measure";
import { MdDragIndicator } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { FaFileExcel } from "react-icons/fa";

import BarChart from "components/organisms/charts/BarChart";
import LineChart from "components/organisms/charts/LineChart";
import DonutChart from "components/organisms/charts/DonutChart";
import { cn } from "lib/utils";
import PivotTable from "components/organisms/charts/PivotTable";

export default function ChartWidget({
  questionId,
  onRemove,
  isEmbedMode,
  filterParameters = {},
}) {
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
        const qResponse = await API.get(`/api/questions/${questionId}`);
        const qDetails = qResponse.data;
        setQuestion(qDetails);

        const queryResponse = await API.post("/api/query/run", {
          sql: qDetails.sql_query,
          connectionId: qDetails.connection_id,
          parameters: filterParameters,
        });

        if (queryResponse.data && queryResponse.data.length > 0) {
          setResults(queryResponse.data);
        } else {
          setResults([]);
        }
      } catch (err) {
        setError("Failed to load widget data.");
      } finally {
        setIsLoading(false);
      }
    };
    loadAndRunQuestion();
  }, [questionId, filterParameters]);

  const transformedData = useMemo(() => {
    if (!question || !question.chart_config || results.length === 0)
      return null;

    const { category, value, values } = question.chart_config;

    if (!category) return null;

    // Untuk Pie Chart - tetap single value
    if (question.chart_type === "pie") {
      if (!value) return null;
      return {
        seriesData: results.map((row) => ({
          name: row[category],
          value: row[value],
        })),
      };
    }

    // Untuk Bar dan Line Chart - support multi values
    // Backward compatibility: jika masih pakai 'value' (data lama), convert ke array
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

  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      );
    if (error)
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-red-500">{error}</p>
        </div>
      );
    if (!question)
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-gray-500">
            No question data available.
          </p>
        </div>
      );

    if (width < 50 || height < 50) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-gray-400 text-sm">Adjusting size...</p>
        </div>
      );
    }

    // Header height ≈ 40px (py-2 + border + text)
    const headerHeight = 40;
    const padding = 24; // inset-3 = 12px * 2

    const chartProps = {
      ...transformedData,
      width: width - padding,
      height: height - headerHeight - padding,
    };

    const containerStyle = {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    switch (question.chart_type) {
      case "bar":
        return (
          <div style={containerStyle}>
            {transformedData && (
              <BarChart
                {...chartProps}
                xAxisRotate="auto"
              />
            )}
          </div>
        );
      case "line":
        return (
          <div style={containerStyle}>
            {transformedData && <LineChart {...chartProps} />}
          </div>
        );
      case "pie":
        return (
          <div style={containerStyle}>
            {transformedData && <DonutChart {...chartProps} />}
          </div>
        );
      case "pivot":
      default:
        return (
          <div style={{ width: "100%", height: "100%" }}>
            <PivotTable
              ref={pivotTableRef}
              data={results}
              savedState={question.chart_config}
              isDashboard={true}
            />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 h-full w-full flex flex-col relative group overflow-hidden">
      {/* HEADER - Draggable area - Fixed height */}
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

        {/* export pivot table sementara taruh sini, nanti harusnya di titik tiga menu */}
        {(question?.chart_type === "pivot" ||
          question?.chart_type === "table") && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              pivotTableRef.current?.exportToExcel();
            }}
            onMouseDown={(e) => {
              e.stopPropagation(); // Prevent drag initiation
            }}
            className="p-1 rounded-full text-gray-500 hover:bg-green-100 hover:text-green-700 pointer-events-auto"
            title="Export to Excel"
            style={{ pointerEvents: "auto" }}
          >
            <FaFileExcel />
          </button>
        )}

        {/* Drag & remove icons */}
        {!isEmbedMode && onRemove && (
          <div className="flex items-center space-x-2">
            <div className="text-gray-400 pointer-events-none">
              <MdDragIndicator />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRemove();
              }}
              onMouseDown={(e) => {
                e.stopPropagation(); // Prevent drag initiation
              }}
              className="p-1 bg-gray-200 rounded-full text-gray-600 hover:bg-red-500 hover:text-white transition-all pointer-events-auto cursor-pointer"
              title="Remove from Dashboard"
              style={{ pointerEvents: "auto" }}
            >
              <IoMdClose />
            </button>
          </div>
        )}
      </div>

      {/* CONTENT AREA - Clickable for chart interaction */}
      <div
        ref={ref}
        className="flex-1 min-h-0 w-full relative"
        style={{
          pointerEvents: "auto",
          userSelect: "auto",
        }}
        onMouseDown={(e) => {
          // Prevent drag initiation when clicking on the chart area
          e.stopPropagation();
        }}
      >
        <div className="absolute inset-3 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
