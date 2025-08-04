import { useState, useEffect, useMemo } from "react";
import { API } from "axios/axios";
import useMeasure from "react-use-measure";
import { MdDragIndicator } from "react-icons/md";
import { IoMdClose } from "react-icons/io";

import BarChart from "components/organisms/charts/BarChart";
import LineChart from "components/organisms/charts/LineChart";
import DonutChart from "components/organisms/charts/DonutChart";
import ResultsTable from "components/organisms/charts/ResultsTable";

export default function ChartWidget({ questionId, onRemove }) {
  const [question, setQuestion] = useState(null);
  const [results, setResults] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
        });

        if (queryResponse.data && queryResponse.data.length > 0) {
          setResults(queryResponse.data);
          setColumns(Object.keys(queryResponse.data[0]));
        } else {
          setResults([]);
        }
      } catch (err) {
        setError("Gagal memuat data widget.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAndRunQuestion();
  }, [questionId]);

  const transformedData = useMemo(() => {
    if (!question || !question.chart_config || results.length === 0)
      return null;
    const { category, value } = question.chart_config;
    if (!category || !value) return null;

    if (question.chart_type === "pie") {
      return {
        seriesData: results.map((row) => ({
          name: row[category],
          value: row[value],
        })),
      };
    }
    return {
      xAxisData: results.map((row) => row[category]),
      seriesData: results.map((row) => row[value]),
    };
  }, [results, question]);

  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-gray-500">Memuat...</p>
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
            Tidak ada data pertanyaan.
          </p>
        </div>
      );

    if (width < 50 || height < 50) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-gray-400 text-sm">
            Menyesuaikan ukuran...
          </p>
        </div>
      );
    }

    // Hitung tinggi header yang sebenarnya (py-2 + border + text = sekitar 40px)
    const headerHeight = 40;
    const padding = 24; // inset-3 = 12px * 2

    const chartProps = {
      ...transformedData,
      width: width - padding,
      height: height - headerHeight - padding, // Kurangi tinggi header yang sebenarnya
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
      case "table":
      default:
        return (
          <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
            <ResultsTable
              columns={columns}
              data={results}
            />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 h-full w-full flex flex-col relative group overflow-hidden">
      {/* HEADER - Area yang bisa didrag - Fixed height */}
      <div className="widget-drag-handle flex items-center justify-between px-3 py-2 cursor-move bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b border-gray-100 flex-shrink-0">
        <h3 className="font-bold text-sm truncate flex-1 pointer-events-none select-none">
          {question?.name || "Memuat..."}
        </h3>

        {/* Icon drag untuk visual cue */}
        <div className="flex items-center space-x-2">
          <div className="text-gray-400 pointer-events-none">
            <MdDragIndicator />
          </div>

          {/* Tombol hapus - dengan pointer-events: auto untuk override drag */}
          {onRemove && (
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
              title="Hapus dari Dashboard"
              style={{ pointerEvents: "auto" }} // Force clickable
            >
              <IoMdClose />
            </button>
          )}
        </div>
      </div>

      {/* CONTENT AREA - Area yang bisa diklik untuk interaksi chart */}
      <div
        ref={ref}
        className="flex-1 min-h-0 w-full relative"
        style={{
          pointerEvents: "auto",
          userSelect: "auto",
        }}
        onMouseDown={(e) => {
          // Prevent drag initiation ketika klik di area chart
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
