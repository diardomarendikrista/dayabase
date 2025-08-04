import ReactECharts from "echarts-for-react";

export default function HorizontalBarChart({
  title,
  yAxisData,
  seriesData,
  xAxisName = "Total Participants",
  onTitleClick,
  height = "400px",
  barColor = "#54a0ff",
}) {
  const getChartOptions = () => ({
    title: {
      text: title,
      left: "left",
      textStyle: { color: "#333", fontWeight: "bold", fontSize: 16 },
    },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: {
      top: 75, // 'top' memberi ruang untuk area judul
      left: "3%",
      right: "5%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: xAxisName,
      nameLocation: "middle",
      nameGap: 30,
      boundaryGap: [0, 0.01],
    },
    yAxis: { type: "category", data: yAxisData, axisLabel: { interval: 0 } },
    series: [
      {
        name: "Total Participants",
        type: "bar",
        data: seriesData,
        barWidth: "60%",
        label: {
          show: true,
          position: "right",
          formatter: (params) => params.value.toLocaleString("id-ID"),
        },
        itemStyle: { color: barColor },
      },
    ],
  });
  return (
    <div className="relative h-full">
      <div
        onClick={onTitleClick}
        className={`absolute top-0 left-0 z-10 bg-white px-2 py-1 text-lg font-bold text-gray-800 ${onTitleClick ? "cursor-pointer hover:text-red-800" : ""}`}
      >
        {title}
      </div>
      <ReactECharts
        option={getChartOptions()}
        style={{ height: height, width: "100%" }}
      />
    </div>
  );
}
