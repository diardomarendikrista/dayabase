import BarChart from "components/organisms/charts/BarChart";
import LineChart from "components/organisms/charts/LineChart";
import DonutChart from "components/organisms/charts/DonutChart";
import PivotTable from "components/organisms/charts/PivotTable";
import { FaFileExcel } from "react-icons/fa";
import { useMemo, useRef } from "react";
import Select from "components/atoms/Select";

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

  const pivotTableRef = useRef(null);

  const columnOptions = useMemo(() => {
    return columns.map((col) => ({ value: col, label: col }));
  }, [columns]);

  const handleCategoryChange = (value) => {
    onChartConfigChange((prev) => ({ ...prev, category: value }));
  };
  const handleValueChange = (value) => {
    console.log("handleValueChange called with:", value);

    if (chartType === "pie") {
      // Untuk pie chart, value adalah string single
      onChartConfigChange((prev) => ({
        ...prev,
        value: value,
        values: undefined, // Hapus values jika ada
      }));
    } else {
      // Untuk bar dan line, value adalah array
      onChartConfigChange((prev) => ({
        ...prev,
        values: value,
        value: undefined, // Hapus value jika ada
      }));
    }
  };

  // Tentukan apakah menggunakan single atau multi select
  const isMultiValue = chartType === "bar" || chartType === "line";
  const currentValue = isMultiValue ? chartConfig.values : chartConfig.value;

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md border">
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onChartTypeChange("pivot")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${chartType === "pivot" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Pivot Table
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

      {(chartType === "pivot" || chartType === "table") && (
        <div className="h-96">
          <button
            onClick={() => pivotTableRef.current?.exportToExcel()}
            className="mb-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 text-sm flex items-center gap-2"
          >
            <FaFileExcel /> Export as Excel
          </button>

          <PivotTable
            ref={pivotTableRef}
            data={results}
            savedState={chartConfig}
            onStateChange={onChartConfigChange}
          />
        </div>
      )}
      {chartType !== "table" && chartType !== "pivot" && (
        <div className="min-h-96">
          <form
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2 mb-4"
          >
            <div className="min-w-[170px]">
              <label className="text-sm font-medium">Category / Label</label>
              <Select
                value={chartConfig.category}
                onChange={handleCategoryChange}
                options={columnOptions}
              />
            </div>
            <div className="min-w-[170px]">
              <label className="text-sm font-medium">
                {isMultiValue ? "Values (Multiple)" : "Value"}
              </label>
              <Select
                value={currentValue}
                onChange={handleValueChange}
                options={columnOptions}
                isMulti={isMultiValue}
              />
            </div>
          </form>

          {transformedData && chartType === "bar" && (
            <BarChart
              xAxisData={transformedData.xAxisData}
              seriesData={transformedData.seriesData}
              xAxisName={chartConfig.category}
              yAxisName="Values"
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
