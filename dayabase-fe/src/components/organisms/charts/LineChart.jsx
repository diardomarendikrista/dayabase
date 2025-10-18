import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

export default function LineChart({
  xAxisData,
  seriesData, // Bisa array angka (single) atau array object (multi)
  width,
  height = "400px",
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

  // Generate series config
  const seriesConfig = useMemo(() => {
    if (isMultiSeries) {
      // Multi-series: seriesData = [{name: "Series1", data: [...]}, ...]
      return seriesData.map((series, index) => ({
        name: series.name,
        type: "line",
        smooth: true,
        data: series.data,
        itemStyle: {
          color: [
            "#2ed573",
            "#ff6b6b",
            "#54a0ff",
            "#feca57",
            "#48dbfb",
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
          type: "line",
          smooth: true,
          data: seriesData,
          itemStyle: { color: "#2ed573" },
        },
      ];
    }
  }, [seriesData, isMultiSeries]);

  const legendData = useMemo(() => {
    if (isMultiSeries) {
      return seriesData.map((s) => s.name);
    }
    return ["Value"];
  }, [seriesData, isMultiSeries]);

  const options = {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: legendData,
      top: 10,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: xAxisData,
    },
    yAxis: {
      type: "value",
    },
    series: seriesConfig,
  };

  return (
    <ReactECharts
      option={options}
      style={{ height: height, width: width }}
    />
  );
}
