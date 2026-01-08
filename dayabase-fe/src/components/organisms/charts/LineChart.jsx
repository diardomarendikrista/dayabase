import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function LineChart({
  xAxisData,
  seriesData, // Bisa array angka (single) atau array object (multi)
  width,
  height = "400px",
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
    <ReactECharts
      option={options}
      style={{ height: height, width: width }}
      notMerge={true} // ini debug buat data nyangkut ketika multiple data dihapus (force refresh)
      onEvents={onEvents}
    />
  );
}
