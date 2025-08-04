import { useState, useMemo } from "react";
import axios from "axios";
import ResultsTable from "components/organisms/charts/ResultsTable";
import BarChart from "components/organisms/charts/BarChart";
import LineChart from "components/organisms/charts/LineChart";
import DonutChart from "components/organisms/charts/DonutChart";

function MVP() {
  const [dbConfig, setDbConfig] = useState({
    dbType: "postgres",
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "dayabase_dummy_data",
  });
  const [sql, setSql] = useState(
    "SELECT category, SUM(amount) as total_sales FROM sales_data GROUP BY category;"
  );

  const [results, setResults] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State untuk kustomisasi chart
  const [chartType, setChartType] = useState("table"); // 'table', 'bar', 'line', 'pie'
  const [chartConfig, setChartConfig] = useState({
    category: "", // sumbu X
    value: "", // sumbu Y
  });

  // Handler untuk mengubah state dbConfig
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setDbConfig((prev) => ({ ...prev, [name]: value }));
  };

  // Handler untuk mengubah state chartConfig
  const handleChartConfigChange = (e) => {
    const { name, value } = e.target;
    setChartConfig((prev) => ({ ...prev, [name]: value }));
  };

  // Fungsi untuk menjalankan query
  const handleRunQuery = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setColumns([]);
    // Reset chart config
    setChartConfig({ category: "", value: "" });

    try {
      const response = await axios.post("http://localhost:4000/api/query/testRun", {
        sql,
        dbConfig,
      });
      if (response.data && response.data.length > 0) {
        const data = response.data;
        const dataColumns = Object.keys(data[0]);
        setResults(data);
        setColumns(dataColumns);
        // Otomatis set chart config ke dua kolom pertama
        setChartConfig({
          category: dataColumns[0] || "",
          value: dataColumns[1] || "",
        });
      } else {
        setResults([]);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Jahit data mentah jadi format chart
  const transformedData = useMemo(() => {
    if (!chartConfig.category || !chartConfig.value || results.length === 0) {
      return null;
    }

    if (chartType === "pie") {
      return {
        seriesData: results.map((row) => ({
          name: row[chartConfig.category],
          value: row[chartConfig.value],
        })),
      };
    }

    // Untuk Bar dan Line Chart
    return {
      xAxisData: results.map((row) => row[chartConfig.category]),
      seriesData: results.map((row) => row[chartConfig.value]),
    };
  }, [results, chartConfig, chartType]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DayaBase</h1>
          <p className="text-gray-600 mt-1">A simple SQL query runner.</p>
        </header>

        {/* Form untuk Koneksi dan Query */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Connection Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <select
              name="dbType"
              value={dbConfig.dbType}
              onChange={handleConfigChange}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mssql">SQL Server</option>
              <option value="sqlite">SQLite</option>
            </select>
            <input
              name="host"
              value={dbConfig.host}
              onChange={handleConfigChange}
              placeholder="Host"
              className="w-full rounded-md border-gray-300 shadow-sm"
            />
            <input
              name="port"
              value={dbConfig.port}
              onChange={handleConfigChange}
              placeholder="Port"
              className="w-full rounded-md border-gray-300 shadow-sm"
            />
            <input
              name="user"
              value={dbConfig.user}
              onChange={handleConfigChange}
              placeholder="User"
              className="w-full rounded-md border-gray-300 shadow-sm"
            />
            <input
              name="password"
              type="password"
              value={dbConfig.password}
              onChange={handleConfigChange}
              placeholder="Password"
              className="w-full rounded-md border-gray-300 shadow-sm"
            />
            <input
              name="database"
              value={dbConfig.database}
              onChange={handleConfigChange}
              placeholder="Database"
              className="w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <h2 className="text-xl font-semibold mb-4 mt-6">SQL Query</h2>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="SELECT category, SUM(amount) as total_sales FROM sales_data GROUP BY category;"
            className="w-full h-40 p-2 border rounded-md font-mono text-sm border-gray-300 shadow-sm"
          />
          <div className="mt-4">
            <button
              onClick={handleRunQuery}
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {isLoading ? "Running..." : "Run Query"}
            </button>
          </div>
        </div>

        {/* Area Hasil */}
        <div className="mt-8">
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md"
              role="alert"
            >
              <strong>Error: </strong>
              <span>{error}</span>
            </div>
          )}
          {isLoading && (
            <p className="text-center text-gray-500">Loading results...</p>
          )}

          {results.length > 0 && !isLoading && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              {/* Tabs untuk memilih visualisasi */}
              <div className="border-b border-gray-200 mb-4">
                <nav
                  className="-mb-px flex space-x-8"
                  aria-label="Tabs"
                >
                  <button
                    onClick={() => setChartType("table")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${chartType === "table" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setChartType("bar")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${chartType === "bar" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                  >
                    Bar Chart
                  </button>
                  <button
                    onClick={() => setChartType("line")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${chartType === "line" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                  >
                    Line Chart
                  </button>
                  <button
                    onClick={() => setChartType("pie")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${chartType === "pie" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                  >
                    Pie Chart
                  </button>
                </nav>
              </div>

              {/* Tampilkan konten berdasarkan tab yang aktif */}
              {chartType === "table" && (
                <ResultsTable
                  columns={columns}
                  data={results}
                />
              )}

              {chartType !== "table" && (
                <div>
                  {/* Pilihan untuk kustomisasi chart */}
                  <div className="flex space-x-4 mb-4">
                    <div>
                      <label className="text-sm font-medium">
                        Category / Label
                      </label>
                      <select
                        name="category"
                        value={chartConfig.category}
                        onChange={handleChartConfigChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        {columns.map((col) => (
                          <option
                            key={col}
                            value={col}
                          >
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Value</label>
                      <select
                        name="value"
                        value={chartConfig.value}
                        onChange={handleChartConfigChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        {columns.map((col) => (
                          <option
                            key={col}
                            value={col}
                          >
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Render chart yang sesuai */}
                  {transformedData && chartType === "bar" && (
                    <BarChart
                      xAxisData={transformedData.xAxisData}
                      seriesData={transformedData.seriesData}
                      xAxisName={chartConfig.category}
                      yAxisName={chartConfig.value}
                    />
                  )}
                  {transformedData && chartType === "line" && (
                    <LineChart
                      xAxisData={transformedData.xAxisData}
                      seriesData={transformedData.seriesData}
                    />
                  )}
                  {transformedData && chartType === "pie" && (
                    <DonutChart seriesData={transformedData.seriesData} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MVP;
