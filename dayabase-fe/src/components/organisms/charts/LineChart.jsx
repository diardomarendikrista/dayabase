import ReactECharts from "echarts-for-react";

export default function LineChart({
  xAxisData,
  seriesData,
  width,
  height = "400px",
}) {
  const options = {
    tooltip: { trigger: "axis" },
    legend: {
      data: ["Value"],
      top: 10,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    }, // 'top' disesuaikan untuk memberi ruang pada legenda
    xAxis: { type: "category", boundaryGap: false, data: xAxisData },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "Value",
        type: "line",
        smooth: true,
        data: seriesData,
        itemStyle: { color: "#2ed573" },
      },
    ],
  };
  return (
    <ReactECharts
      option={options}
      style={{ height: height, width: width }}
    />
  );
}
