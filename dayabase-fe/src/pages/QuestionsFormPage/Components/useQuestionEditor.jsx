import { API } from "axios/axios";
import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { addToast } from "store/slices/toastSlice";

export function useQuestionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [pageTitle, setPageTitle] = useState("");
  const [connections, setConnections] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [sql, setSql] = useState("");
  const [results, setResults] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [chartType, setChartType] = useState("pivot"); // Default ke pivot
  const [chartConfig, setChartConfig] = useState({});

  const handleRunQuery = async (options = {}) => {
    const { newSql, newConnectionId, isInitialLoad = false } = options;
    const finalSql = newSql || sql;
    const finalConnectionId = newConnectionId || selectedConnectionId;

    setErrors(false);

    if (!finalConnectionId) {
      dispatch(
        addToast({
          message: "Please select a database connection.",
          type: "error",
        })
      );
      return;
    }

    setIsLoading(true);
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
        if (!isInitialLoad) {
          setChartConfig({
            ...chartConfig, // Pertahankan state pivot yang mungkin sudah ada
            category: dataColumns[0] || "",
            value: dataColumns[1] || "",
          });
        }
      } else {
        setResults([]);
      }
    } catch (err) {
      setErrors({
        api: err.response?.data?.message || "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    const newErrors = {};
    if (!pageTitle.trim()) newErrors.pageTitle = "Question title is required.";
    if (!selectedConnectionId)
      newErrors.selectedConnectionId =
        "Select a database connection to use for this question.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    let finalChartConfig = { ...chartConfig };
    if (chartType !== "pivot" && chartType !== "table") {
      delete finalChartConfig.colState;
      delete finalChartConfig.groupState;
      delete finalChartConfig.filterState;
    }

    // get collection Id
    const queryParams = new URLSearchParams(location.search);
    const collectionId = queryParams.get("collectionId");

    const payload = {
      name: pageTitle,
      sql_query: sql,
      chart_type: chartType,
      chart_config: finalChartConfig,
      connection_id: selectedConnectionId,
      collection_id: collectionId,
    };
    try {
      if (id) {
        await API.put(`/api/questions/${id}`, payload);
      } else {
        await API.post("/api/questions", payload);
      }
      navigate(`/collections/${collectionId}`);
      dispatch(
        addToast({
          message: id
            ? "Question updated successfully."
            : "Question saved successfully.",
          type: "success",
        })
      );
    } catch (err) {
      console.error("Failed to save/update question:", err);
      setErrors({ api: err.response?.data?.message || "Operation failed." });
    }
  };

  const transformedData = useMemo(() => {
    if (!chartConfig?.category || !chartConfig?.value || results.length === 0)
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

  useEffect(() => {
    const resetState = () => {
      setPageTitle("");
      setSql("");
      setResults([]);
      setColumns([]);
      setChartType("pivot");
      setChartConfig({}); // Default ke pivot
      if (connections.length > 0) setSelectedConnectionId(connections[0].id);
    };

    if (id) {
      const fetchQuestionData = async () => {
        setIsLoading(true);
        try {
          const response = await API.get(`/api/questions/${id}`);
          const q = response.data;
          setPageTitle(q.name);
          setSql(q.sql_query);
          setSelectedConnectionId(q.connection_id);
          setChartType(q.chart_type);
          setChartConfig(q.chart_config);
          handleRunQuery({
            newSql: q.sql_query,
            newConnectionId: q.connection_id,
            isInitialLoad: true,
          });
        } catch (err) {
          dispatch(
            addToast({ message: "Could not find the question.", type: "error" })
          );
          navigate("/questions");
        }
      };
      fetchQuestionData();
    } else {
      resetState();
    }
  }, [id, connections, dispatch, navigate]);

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
    errors,
    setErrors,
    chartType,
    setChartType,
    chartConfig,
    setChartConfig,
    transformedData,
    handleRunQuery,
    handleSaveQuestion,
  };
}
