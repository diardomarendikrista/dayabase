import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
  const navigate = useNavigate();
  const { token } = useParams();
  const isEmbedMode = !!token;

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

  // CLICK EVENT HANDLER
  const onChartClick = (params) => {
    if (!clickBehavior || !clickBehavior.enabled) return;

    // Ambil nilai kategori yang diklik (90% kasus biasanya pakai Sumbu X aja)
    const clickedCategory = params.name;

    // Susun Parameter URL
    const queryParams = new URLSearchParams();

    if (
      clickBehavior.parameter_mappings &&
      Array.isArray(clickBehavior.parameter_mappings)
    ) {
      clickBehavior.parameter_mappings.forEach((mapping) => {
        const paramKey = mapping.targetParam || mapping.target_param;
        const paramValue = clickedCategory;

        if (paramKey && paramValue) {
          queryParams.append(paramKey, paramValue);
        }
      });
    }

    const queryString = queryParams.toString();
    let targetUrl;
    const { action, target_id, target_url, target_token } = clickBehavior;

    // Eksekusi Navigasi
    if (action === "link_to_dashboard") {
      if (isEmbedMode) {
        if (target_token) {
          targetUrl = `/embed/dashboards/${target_token}?${queryString}`;
        } else {
          console.warn("Target dashboard is not public or token missing.");
          return;
        }
      } else {
        targetUrl = `/dashboards/${target_id}?${queryString}`;
      }
    } else if (action === "link_to_question") {
      if (isEmbedMode && token) {
        targetUrl = `/embed/dashboards/${token}/questions/${target_id}/view?${queryString}`;
      } else {
        targetUrl = `/questions/${target_id}/view?${queryString}`;
      }
    } else if (action === "link_to_url") {
      // External URL handling
      let finalUrl = target_url;
      // Simple string replacement for dynamic URL
      // misal https://google.com/search?q={{category}}
      finalUrl = finalUrl.replace("{{value}}", clickedCategory);

      window.open(finalUrl, "_blank");
      return;
    }

    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  // Daftarkan event listener
  const onEvents = {
    click: onChartClick,
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
