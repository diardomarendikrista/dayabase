// pages/QuestionsFormPage/Components/VisualizationPanel.jsx
import { FaFileExcel } from "react-icons/fa";
import { useMemo, useRef } from "react";
import Select from "components/atoms/Select";
import ChartRenderer from "components/organisms/ChatRenderer";

export default function VisualizationPanel({
  error,
  isLoading,
  results,
  columns,
  chartType,
  onChartTypeChange,
  chartConfig,
  onChartConfigChange,
}) {
  const pivotTableRef = useRef(null);

  const columnOptions = useMemo(() => {
    return columns.map((col) => ({ value: col, label: col }));
  }, [columns]);

  if (error) {
    return (
      <div className="mt-8 bg-red-100 border-red-400 text-red-700 p-4 rounded-md">
        Error: {error}
      </div>
    );
  }

  if (isLoading) {
    return <p className="mt-8 text-center">Loading...</p>;
  }

  if (results.length === 0) {
    return null;
  }

  const handleCategoryChange = (value) => {
    onChartConfigChange((prev) => ({ ...prev, category: value }));
  };

  const handleValueChange = (value) => {
    if (chartType === "pie") {
      // Single value for pie
      onChartConfigChange((prev) => ({
        ...prev,
        value: value,
        values: undefined,
      }));
    } else {
      // Array for bar/line
      onChartConfigChange((prev) => ({
        ...prev,
        values: value,
        value: undefined,
      }));
    }
  };

  const isMultiValue = chartType === "bar" || chartType === "line";
  const currentValue = isMultiValue ? chartConfig.values : chartConfig.value;
  const isPivotOrTable = chartType === "pivot" || chartType === "table";

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md border">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onChartTypeChange("pivot")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              chartType === "pivot"
                ? "border-primary-light text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pivot Table
          </button>
          <button
            onClick={() => onChartTypeChange("bar")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              chartType === "bar"
                ? "border-primary-light text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => onChartTypeChange("line")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              chartType === "line"
                ? "border-primary-light text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Line
          </button>
          <button
            onClick={() => onChartTypeChange("pie")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              chartType === "pie"
                ? "border-primary-light text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pie
          </button>
        </nav>
      </div>

      {/* Config Controls for non-pivot charts */}
      {!isPivotOrTable && (
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
      )}

      {/* Export button for pivot */}
      {isPivotOrTable && (
        <button
          onClick={() => pivotTableRef.current?.exportToExcel()}
          className="mb-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 text-sm flex items-center gap-2"
        >
          <FaFileExcel /> Export as Excel
        </button>
      )}

      {/* Chart Renderer - SINGLE COMPONENT! 🎉 */}
      <div style={{ height: isPivotOrTable ? "400px" : "500px" }}>
        <ChartRenderer
          ref={pivotTableRef}
          chartType={chartType}
          data={results}
          chartConfig={chartConfig}
          savedState={chartConfig}
          onStateChange={onChartConfigChange}
          isDashboard={false}
        />
      </div>
    </div>
  );
}
