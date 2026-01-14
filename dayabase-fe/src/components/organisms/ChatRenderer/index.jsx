import { useMemo, forwardRef } from "react";
import BarChart from "components/organisms/charts/BarChart";
import LineChart from "components/organisms/charts/LineChart";
import DonutChart from "components/organisms/charts/DonutChart";
import TableWidget from "components/organisms/charts/TableWidget";
import EmptyState from "./EmptyState";

const DATA_LIMIT_CHARTS = 2000; // Batas aman untuk grafik
const DATA_LIMIT_TABLE = 10000; // Batas aman untuk tabel

/**
 * Universal Chart Renderer
 * Single source of truth for rendering all chart types
 *
 * @param {string} chartType - Type of chart: 'bar', 'line', 'pie', 'pivot', 'table'
 * @param {Array} data - Raw data array
 * @param {Object} chartConfig - Chart configuration (category, value, values, etc)
 * @param {Object} savedState - Saved state for pivot table
 * @param {Function} onStateChange - State change handler for pivot table
 * @param {boolean} isDashboard - Whether rendered in dashboard context
 * @param {Object} clickBehavior - Click behavior configuration
 * @param {Function} onRowClick - Row click handler
 * @param {number} width - Chart width (optional, for fixed size)
 * @param {number} height - Chart height (optional, for fixed size)
 */
const ChartRenderer = forwardRef(
  (
    {
      chartType,
      data,
      chartConfig,
      savedState,
      onStateChange,
      isDashboard = false,
      clickBehavior = null,
      onRowClick = null,
      width,
      height,
      className = "",
    },
    ref
  ) => {
    // SAFETY CHECK: DATA LIMIT
    const isTable = chartType === "table" || chartType === "pivot";
    const limit = isTable ? DATA_LIMIT_TABLE : DATA_LIMIT_CHARTS;

    if (data && data.length > limit) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
          <RiErrorWarningLine
            size={48}
            className="text-amber-500 mb-2"
          />
          <h4 className="font-bold text-gray-700">Data Too Large to Display</h4>
          <p className="text-sm mt-1">
            We found <b>{data.length.toLocaleString()} rows</b>. Browser
            performance may suffer.
          </p>
          <p className="text-sm mt-2 bg-amber-50 text-amber-800 px-3 py-1 rounded border border-amber-200">
            Please use filters to reduce data below {limit.toLocaleString()}.
          </p>
        </div>
      );
    }

    // Transform data for bar/line/pie charts
    const transformedData = useMemo(() => {
      if (!chartConfig?.category || !data || data.length === 0) {
        return null;
      }

      const { category, value, values } = chartConfig;

      // Pie chart - single value
      if (chartType === "pie") {
        if (!value) return null;
        return {
          seriesData: data.map((row) => ({
            name: row[category],
            value: row[value],
          })),
        };
      }

      // Bar/Line charts - multiple values
      if (chartType === "bar" || chartType === "line") {
        const valueColumns = values || (value ? [value] : null);
        if (
          !valueColumns ||
          !Array.isArray(valueColumns) ||
          valueColumns.length === 0
        ) {
          return null;
        }

        return {
          xAxisData: data.map((row) => row[category]),
          seriesData: valueColumns.map((valueColumn) => ({
            name: valueColumn,
            data: data.map((row) => row[valueColumn]),
          })),
        };
      }

      return null;
    }, [data, chartConfig, chartType]);

    // Render based on chart type
    switch (chartType) {
      case "bar":
        if (!transformedData)
          return <EmptyState message="Invalid chart configuration" />;
        return (
          <div
            className={className}
            style={{ width: "100%", height: "100%" }}
          >
            <BarChart
              xAxisData={transformedData.xAxisData}
              seriesData={transformedData.seriesData}
              xAxisName={chartConfig.category}
              yAxisName="Values"
              minWidth={width}
              height={height}
              xAxisRotate="auto"
              clickBehavior={clickBehavior}
            />
          </div>
        );

      case "line":
        if (!transformedData)
          return <EmptyState message="Invalid chart configuration" />;
        return (
          <div
            className={className}
            style={{ width: "100%", height: "100%" }}
          >
            <LineChart
              xAxisData={transformedData.xAxisData}
              seriesData={transformedData.seriesData}
              minWidth={width}
              height={height}
              clickBehavior={clickBehavior}
            />
          </div>
        );

      case "pie":
        if (!transformedData)
          return <EmptyState message="Invalid chart configuration" />;
        return (
          <div
            className={className}
            style={{ width: "100%", height: "100%" }}
          >
            <DonutChart
              seriesData={transformedData.seriesData}
              minWidth={width}
              height={height}
              clickBehavior={clickBehavior}
            />
          </div>
        );

      case "pivot":
      case "table":
      default:
        return (
          <div
            className={className}
            style={{ width: "100%", height: "100%" }}
          >
            <TableWidget
              ref={ref}
              data={data}
              savedState={savedState || chartConfig}
              onStateChange={onStateChange}
              isDashboard={isDashboard}
              clickBehavior={clickBehavior}
              onRowClick={onRowClick}
            />
          </div>
        );
    }
  }
);

ChartRenderer.displayName = "ChartRenderer";

export default ChartRenderer;
