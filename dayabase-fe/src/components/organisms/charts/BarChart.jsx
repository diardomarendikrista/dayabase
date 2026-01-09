import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useChartClick } from "./hooks/useChartClick";

export default function BarChart({
  title,
  xAxisData,
  xAxisRotate = "auto",
  xAxisName = "",
  yAxisName = "",
  seriesData, // Bisa berupa array angka (single) atau array object (multi)
  onTitleClick,
  width = "100%",
  height = "400px",
  grid,
  clickBehavior,
}) {
  // Deteksi apakah multi-series atau single-series
  const isMultiSeries = useMemo(() => {
    return (
      Array.isArray(seriesData) &&
      seriesData.length > 0 &&
      typeof seriesData[0] === "object" &&
      seriesData[0].hasOwnProperty("data")
    );
  }, [seriesData]);

  // Rumus auto rotate xAxis
  const calculateRotation = useMemo(() => {
    if (typeof xAxisRotate === "number") {
      return xAxisRotate;
    }

    if (!xAxisData || xAxisData.length === 0) return 0;

    const containerWidth = typeof width === "string" ? 400 : width;
    const availableWidth = containerWidth * 0.8;
    const labelCount = xAxisData.length;

    const avgLabelLength =
      xAxisData.reduce((sum, label) => sum + String(label).length, 0) /
      labelCount;

    const estimatedLabelWidth = avgLabelLength * 8;
    const totalLabelsWidth = estimatedLabelWidth * labelCount;

    if (totalLabelsWidth > availableWidth) {
      if (totalLabelsWidth > availableWidth * 2) {
        return 90;
      } else {
        return 45;
      }
    }

    return 0;
  }, [xAxisData, width, xAxisRotate]);

  // Generate series config
  const seriesConfig = useMemo(() => {
    if (isMultiSeries) {
      // Multi-series: seriesData = [{name: "Series1", data: [...]}, ...]
      return seriesData.map((series, index) => ({
        name: series.name,
        type: "bar",
        data: series.data,
        label: {
          show: true,
          position: "top",
          formatter: (params) => params.value.toLocaleString("id-ID"),
        },
        // Warna berbeda untuk tiap series
        itemStyle: {
          color: [
            "#54a0ff",
            "#ff6b6b",
            "#48dbfb",
            "#1dd1a1",
            "#feca57",
            "#ff9ff3",
            "#5f27cd",
          ][index % 7],
        },
      }));
    } else {
      // Single series: seriesData = [val1, val2, ...]
      return [
        {
          name: "Value",
          type: "bar",
          data: seriesData,
          label: {
            show: true,
            position: "top",
            formatter: (params) => params.value.toLocaleString("id-ID"),
          },
          itemStyle: { color: "#54a0ff" },
        },
      ];
    }
  }, [seriesData, isMultiSeries]);

  const getChartOptions = () => ({
    title: {
      text: title,
      left: "left",
      textStyle: { color: "#333", fontWeight: "bold", fontSize: 16 },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: isMultiSeries
      ? {
          data: seriesData.map((s) => s.name),
          top: 30,
        }
      : undefined,
    grid: {
      top: isMultiSeries ? 75 : 50,
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true,
      ...grid,
    },
    xAxis: {
      type: "category",
      data: xAxisData,
      // name: xAxisName,
      nameLocation: "middle",
      nameGap: calculateRotation > 0 ? 50 : 30,
      axisLabel: {
        interval: 0,
        rotate: calculateRotation,
        verticalAlign: calculateRotation === 90 ? "middle" : "top",
        align:
          calculateRotation === 90
            ? "right"
            : calculateRotation === 45
              ? "right"
              : "center",
      },
    },
    yAxis: {
      type: "value",
      // name: yAxisName,
      nameLocation: "middle",
      nameGap: 50,
    },
    series: seriesConfig,
  });

  const onEvents = {
    click: useChartClick(clickBehavior),
  };

  return (
    <div className="relative h-full">
      {title && (
        <div
          onClick={onTitleClick}
          className={`absolute top-0 left-0 z-10 bg-white px-2 py-1 text-lg font-bold text-gray-800 ${
            onTitleClick ? "cursor-pointer hover:text-red-800" : ""
          }`}
        >
          {title}
        </div>
      )}
      <ReactECharts
        option={getChartOptions()}
        style={{ height: height, width: width }}
        notMerge={true}
        onEvents={onEvents}
      />
    </div>
  );
}
