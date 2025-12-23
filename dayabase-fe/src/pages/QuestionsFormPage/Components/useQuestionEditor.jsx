import { API } from "axios/axios";
import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { addToast } from "store/slices/toastSlice";

const STORAGE_KEY_CONN = "dayabase_last_connection_id";

export function useQuestionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // get collection Id for create new question
  const queryParams = new URLSearchParams(location.search);
  const collectionId = queryParams.get("collectionId");

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
  const [dataQuestion, setDataQuestion] = useState({});

  const handleConnectionChange = (value) => {
    setSelectedConnectionId(value);

    if (value) {
      localStorage.setItem(STORAGE_KEY_CONN, value);
    }

    if (errors.selectedConnectionId) {
      const newErrors = { ...errors };
      delete newErrors.selectedConnectionId;
      setErrors(newErrors);
    }
  };

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
          const newConfig = {
            ...chartConfig,
            category: dataColumns[0] || "",
          };

          // Set value/values berdasarkan chartType
          if (chartType === "pie") {
            newConfig.value = dataColumns[1] || "";
          } else if (chartType === "bar" || chartType === "line") {
            newConfig.values = [dataColumns[1] || ""];
          }

          setChartConfig(newConfig);
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

  useEffect(() => {
    // Hanya jalankan saat chartType berubah DAN ada results
    if (results.length === 0 || !columns.length) return;

    setChartConfig((prev) => {
      const newConfig = { ...prev };

      // Pastikan ada category
      if (!newConfig.category && columns.length > 0) {
        newConfig.category = columns[0];
      }

      // Set value/values sesuai chartType
      if (chartType === "pie") {
        // Pie butuh single value
        if (prev.values && !prev.value) {
          newConfig.value = Array.isArray(prev.values)
            ? prev.values[0]
            : columns[1] || "";
          delete newConfig.values;
        } else if (!prev.value && columns.length > 1) {
          newConfig.value = columns[1];
          delete newConfig.values;
        }
      } else if (chartType === "bar" || chartType === "line") {
        // Bar/Line butuh array values
        if (prev.value && !prev.values) {
          newConfig.values = [prev.value];
          delete newConfig.value;
        } else if (!prev.values && columns.length > 1) {
          newConfig.values = [columns[1]];
          delete newConfig.value;
        }
      }

      return newConfig;
    });
  }, [chartType, columns]); // Tambah columns di dependency

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

    const payload = {
      name: pageTitle,
      sql_query: sql,
      chart_type: chartType,
      chart_config: finalChartConfig,
      connection_id: selectedConnectionId,
      collection_id: dataQuestion.collection_id || collectionId,
    };
    try {
      if (id) {
        await API.put(`/api/questions/${id}`, payload);
      } else {
        await API.post("/api/questions", payload);
      }
      navigate(`/collections/${dataQuestion.collection_id || collectionId}`);
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
      setErrors({
        api: err.response?.data?.message || "An unknown error occurred.",
      });
    }
  };

  const transformedData = useMemo(() => {
    // console.log("Computing transformedData", {
    //   chartType,
    //   chartConfig,
    //   resultsLength: results.length,
    // });

    if (!chartConfig?.category || results.length === 0) {
      // console.log("Return null: no category or no results");
      return null;
    }

    // Untuk Pie Chart
    if (chartType === "pie") {
      if (!chartConfig?.value) {
        console.log("Return null: pie but no value");
        return null;
      }
      return {
        seriesData: results.map((row) => ({
          name: row[chartConfig.category],
          value: row[chartConfig.value],
        })),
      };
    }

    // Untuk Bar dan Line Chart
    const values = chartConfig?.values;
    console.log("Bar/Line values:", values);

    if (!values || !Array.isArray(values) || values.length === 0) {
      console.log("Return null: bar/line but invalid values");
      return null;
    }

    const transformed = {
      xAxisData: results.map((row) => row[chartConfig.category]),
      seriesData: values.map((valueColumn) => ({
        name: valueColumn,
        data: results.map((row) => row[valueColumn]),
      })),
    };
    // console.log(transformed);

    return transformed;
  }, [results, chartConfig, chartType]);

  useEffect(() => {
    if (location.pathname === "/questions/new" && !collectionId) {
      navigate("/");
    }
  }, [location.pathname, collectionId, navigate]);

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
    };

    // logic default connection pakai localstorage
    if (connections.length > 0) {
      const lastConnId = localStorage.getItem(STORAGE_KEY_CONN);

      // Cek apakah ID di storage valid (masih ada di list connections),
      const foundConnection = connections.find(
        (c) => c.id.toString() === lastConnId
      );

      if (foundConnection) {
        setSelectedConnectionId(foundConnection.id);
      } else {
        // Jika tidak ada di storage atau ID invalid (misal dihapus), fallback ke yang pertama
        setSelectedConnectionId(connections[0].id);
      }
    }

    if (id) {
      const fetchQuestionData = async () => {
        setIsLoading(true);
        try {
          const { data } = await API.get(`/api/questions/${id}`);
          console.log(data);

          setDataQuestion(data);
          setPageTitle(data.name);
          setSql(data.sql_query);
          setSelectedConnectionId(data.connection_id);
          setChartType(data.chart_type);
          setChartConfig(data.chart_config);
          handleRunQuery({
            newSql: data.sql_query,
            newConnectionId: data.connection_id,
            isInitialLoad: true,
          });
        } catch (err) {
          // console.log(err);
          setErrors({
            api: err.response?.data?.message || "An unknown error occurred.",
            status: err.response?.status,
          });
        }
      };
      if (connections.length > 0) {
        fetchQuestionData();
      }
    } else {
      resetState();
    }
  }, [id, connections, dispatch, navigate]);

  return {
    id,
    dataQuestion,
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
    handleConnectionChange,
    handleSaveQuestion,
  };
}
