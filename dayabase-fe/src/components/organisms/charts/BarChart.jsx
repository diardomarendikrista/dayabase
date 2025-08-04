import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

export default function BarChart({
  title,
  xAxisData,
  xAxisRotate = "auto",
  xAxisName = "",
  yAxisName = "",
  seriesData,
  onTitleClick,
  width = "100%",
  height = "400px",
  grid,
}) {
  // rumus auto rotate xAxis
  const calculateRotation = useMemo(() => {
    if (typeof xAxisRotate === "number") {
      return xAxisRotate; // Jika sudah ditentukan angka, gunakan itu
    }

    if (!xAxisData || xAxisData.length === 0) return 0;

    // Hitung lebar rata-rata container (asumsi)
    const containerWidth = typeof width === "string" ? 400 : width;
    const availableWidth = containerWidth * 0.8;
    const labelCount = xAxisData.length;

    // Hitung panjang karakter rata-rata dari label
    const avgLabelLength =
      xAxisData.reduce((sum, label) => sum + String(label).length, 0) /
      labelCount;

    // Estimasi lebar per karakter (sekitar 8px per karakter)
    const estimatedLabelWidth = avgLabelLength * 8;
    const totalLabelsWidth = estimatedLabelWidth * labelCount;

    // Jika total lebar label lebih besar dari ruang yang tersedia
    if (totalLabelsWidth > availableWidth) {
      // Jika sangat panjang, putar 45 derajat, jika sangat-sangat panjang, putar 90
      if (totalLabelsWidth > availableWidth * 2) {
        return 90;
      } else {
        return 45;
      }
    }

    return 0; // Tidak perlu rotasi
  }, [xAxisData, width, xAxisRotate]);

  // const calculateInterval = useMemo(() => {
  //   if (!xAxisData) return 0;

  //   const labelCount = xAxisData.length;

  //   // Jika label terlalu banyak, tampilkan setiap n label
  //   if (labelCount > 20) return Math.floor(labelCount / 20);
  //   if (labelCount > 10) return Math.floor(labelCount / 10);

  //   return 0; // Tampilkan semua label
  // }, [xAxisData]);

  const getChartOptions = () => ({
    title: {
      text: title,
      left: "left",
      textStyle: { color: "#333", fontWeight: "bold", fontSize: 16 },
    },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: {
      // top: 75,
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true,
      ...grid,
    },
    xAxis: {
      type: "category",
      data: xAxisData,
      name: xAxisName,
      nameLocation: "middle",
      nameGap: calculateRotation > 0 ? 50 : 30, // Sesuaikan jarak nama sumbu
      axisLabel: {
        // interval: calculateInterval,
        interval: 0,
        rotate: calculateRotation,
        // Sesuaikan alignment berdasarkan rotasi
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
      name: yAxisName,
      nameLocation: "middle",
      nameGap: 50,
    },
    series: [
      {
        name: "Total Participant",
        type: "bar",
        data: seriesData,
        barWidth: "50%",
        label: {
          show: true,
          position: "top",
          formatter: (params) => params.value.toLocaleString("id-ID"),
        },
        itemStyle: { color: "#54a0ff" },
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
        style={{ height: height, width: width }}
      />
    </div>
  );
}
