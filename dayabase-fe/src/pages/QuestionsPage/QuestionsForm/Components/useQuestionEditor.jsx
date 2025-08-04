import { API } from "axios/axios";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

export function useQuestionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [pageTitle, setPageTitle] = useState("New Question");
  const [connections, setConnections] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [sql, setSql] = useState("");
  const [results, setResults] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState("table");
  const [chartConfig, setChartConfig] = useState({ category: "", value: "" });

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await API.get("/api/connections");
        setConnections(response.data);
      } catch (error) {
        console.error("Failed to fetch connections", error);
      }
    };
    fetchConnections();
  }, []);

  // Effect untuk mengambil data pertanyaan JIKA ada 'id' di URL
  useEffect(() => {
    const resetState = () => {
      setPageTitle("New Question");
      setSql("");
      setResults([]);
      setColumns([]);
      setChartType("table");
      setChartConfig({ category: "", value: "" });
      if (connections.length > 0) {
        setSelectedConnectionId(connections[0].id);
      }
    };

    if (id) {
      const fetchQuestionData = async () => {
        setIsLoading(true);
        try {
          const response = await API.get(`/api/questions/${id}`);
          const q = response.data;

          // Set semua state dari data yang ada
          setPageTitle(q.name);
          setSql(q.sql_query);
          setSelectedConnectionId(q.connection_id);
          setChartType(q.chart_type);
          setChartConfig(q.chart_config);

          // Langsung load query dengan flag isInitialLoad
          handleRunQuery({
            newSql: q.sql_query,
            newConnectionId: q.connection_id,
            isInitialLoad: true,
          });
        } catch (err) {
          alert("Could not find the question.");
          navigate("/questions");
        }
        // setIsLoading(false) di-handle oleh handleRunQuery
      };
      fetchQuestionData();
    } else {
      resetState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, connections]);

  const handleRunQuery = async (options = {}) => {
    const { newSql, newConnectionId, isInitialLoad = false } = options;

    const finalSql = newSql || sql;
    const finalConnectionId = newConnectionId || selectedConnectionId;

    if (!finalConnectionId)
      return alert("Please select a database connection.");

    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      const response = await API.post("/api/query/run", {
        sql: finalSql,
        connectionId: finalConnectionId,
      });

      if (response.data && response.data.length > 0) {
        const data = response.data;
        const dataColumns = Object.keys(data[0]);
        setResults(data);
        setColumns(dataColumns);

        // HANYA reset chart config jika ini BUKAN load awal
        if (!isInitialLoad) {
          setChartConfig({
            category: dataColumns[0] || "",
            value: dataColumns[1] || "",
          });
        }
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    const name = id
      ? pageTitle
      : window.prompt("Enter a name for this question:");

    if (name && selectedConnectionId) {
      const payload = {
        name,
        sql_query: sql,
        chart_type: chartType,
        chart_config: chartConfig,
        connection_id: selectedConnectionId,
      };

      try {
        if (id) {
          // Mode UPDATE
          await API.put(`api/questions/${id}`, payload);
          alert("Question updated successfully!");
        } else {
          // Mode CREATE
          await API.post("api/questions", payload);
          alert("Question saved successfully!");
        }
        // Setelah berhasil, kembali ke halaman daftar
        navigate("/questions");
      } catch (error) {
        console.error("Failed to save/update question:", error);
        alert("Operation failed. Please check the console.");
      }
    }
  };

  const transformedData = useMemo(() => {
    if (!chartConfig.category || !chartConfig.value || results.length === 0)
      return null;
    if (chartType === "pie")
      return {
        seriesData: results.map((row) => ({
          name: row[chartConfig.category],
          value: row[chartConfig.value],
        })),
      };
    return {
      xAxisData: results.map((row) => row[chartConfig.category]),
      seriesData: results.map((row) => row[chartConfig.value]),
    };
  }, [results, chartConfig, chartType]);

  // Kembalikan semua state dan handler yang dibutuhkan oleh UI
  return {
    id,
    pageTitle,
    setPageTitle,
    sql,
    setSql,
    connections,
    selectedConnectionId,
    setSelectedConnectionId,
    results,
    columns,
    isLoading,
    error,
    chartType,
    setChartType,
    chartConfig,
    setChartConfig,
    transformedData,
    handleRunQuery,
    handleSaveQuestion,
  };
}
