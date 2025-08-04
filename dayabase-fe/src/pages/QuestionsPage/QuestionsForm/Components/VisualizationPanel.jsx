import BarChart from "components/organisms/charts/BarChart";
import ResultsTable from "components/organisms/charts/ResultsTable";
import LineChart from "components/organisms/charts/LineChart";
import DonutChart from "components/organisms/charts/DonutChart";

export default function VisualizationPanel({
  error,
  isLoading,
  results,
  columns,
  chartType,
  onChartTypeChange,
  chartConfig,
  onChartConfigChange,
  transformedData,
}) {
  if (error)
    return (
      <div className="mt-8 bg-red-100 border-red-400 text-red-700 p-4 rounded-md">
        Error: {error}
      </div>
    );
  if (isLoading) return <p className="mt-8 text-center">Loading...</p>;
  if (results.length === 0) return null;

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md border">
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onChartTypeChange("table")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${chartType === "table" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Table
          </button>
          <button
            onClick={() => onChartTypeChange("bar")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${chartType === "bar" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Bar
          </button>
          <button
            onClick={() => onChartTypeChange("line")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${chartType === "line" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Line
          </button>
          <button
            onClick={() => onChartTypeChange("pie")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${chartType === "pie" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Pie
          </button>
        </nav>
      </div>

      {chartType === "table" && (
        <ResultsTable
          columns={columns}
          data={results}
        />
      )}

      {chartType !== "table" && (
        <div>
          <div className="flex space-x-4 mb-4">
            <div>
              <label className="text-sm font-medium">Category / Label</label>
              <select
                name="category"
                value={chartConfig.category}
                onChange={onChartConfigChange}
                className="mt-1 block w-full rounded-md border-gray-300"
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
                onChange={onChartConfigChange}
                className="mt-1 block w-full rounded-md border-gray-300"
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
  );
}
