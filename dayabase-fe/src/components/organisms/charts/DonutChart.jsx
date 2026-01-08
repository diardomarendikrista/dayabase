import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function DonutChart({
  title,
  seriesData,
  width = "100%",
  height = "400px",
  showTotal = true,
  showLegend = true,
  legend,
  clickBehavior,
}) {
  const navigate = useNavigate();
  const { token } = useParams();
  const isEmbedMode = !!token;

  // Validasi data
  const isValidData = useMemo(() => {
    return (
      seriesData &&
      Array.isArray(seriesData) &&
      seriesData.length > 0 &&
      seriesData.some((item) => Number(item.value || 0) > 0)
    );
  }, [seriesData]);

  // Hitung total
  const total = useMemo(() => {
    if (!isValidData) return 0;
    return seriesData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  }, [seriesData, isValidData]);

  // Hitung dimensi chart berdasarkan apakah ada legend
  const chartDimensions = useMemo(() => {
    const hasLegend = showLegend && isValidData;
    const legendHeight = hasLegend ? 60 : 0; // Ruang untuk legend
    const availableHeight =
      typeof height === "string" ? parseInt(height) || 400 : height;

    // Radius disesuaikan dengan tinggi yang tersedia
    const effectiveHeight = availableHeight - legendHeight - 40; // 40px untuk padding
    const maxRadius = Math.min(effectiveHeight, 300) / 2; // Maksimal radius

    return {
      innerRadius: Math.max(maxRadius * 0.5, 30), // Minimal 30px untuk inner radius
      outerRadius: Math.max(maxRadius * 0.8, 50), // Minimal 50px untuk outer radius
      centerY: hasLegend ? "45%" : "50%", // Naikkan sedikit jika ada legend
      legendHeight,
    };
  }, [height, showLegend, isValidData]);

  if (!isValidData) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center bg-gray-50 rounded"
      >
        <p className="text-gray-500 text-center">
          {!seriesData || seriesData.length === 0
            ? "Tidak ada data untuk ditampilkan"
            : "Data tidak valid atau kosong"}
        </p>
      </div>
    );
  }

  const getChartOptions = () => ({
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const value = params.value ? params.value.toLocaleString("id-ID") : 0;
        const percent = params.percent || 0;
        return `${params.name}: <b>${value}</b> (${percent}%)`;
      },
    },
    ...(showLegend && {
      legend: {
        orient: "horizontal",
        type: "scroll",
        top: "bottom",
        left: "center",
        itemWidth: 14,
        itemHeight: 14,
        textStyle: {
          fontSize: 12,
        },
        formatter: (name) => {
          const item = seriesData.find((p) => p.name === name);
          if (!item || total === 0) return name;
          const percentage = ((Number(item.value || 0) / total) * 100).toFixed(
            1
          );
          return `${name} (${percentage}%)`;
        },
        ...legend,
      },
    }),
    series: [
      {
        name: title || "Data",
        type: "pie",
        radius: [
          `${chartDimensions.innerRadius}px`,
          `${chartDimensions.outerRadius}px`,
        ],
        center: ["50%", chartDimensions.centerY],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 5,
        },
        data: seriesData.map((item) => ({
          ...item,
          value: Number(item.value || 0),
        })),
      },
    ],
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
    <div
      className="relative overflow-hidden"
      style={{ width, height }}
    >
      {/* Title jika ada */}
      {title && (
        <div className="absolute top-2 left-2 z-20 text-sm font-semibold text-gray-700">
          {title}
        </div>
      )}

      {/* Teks total di tengah */}
      {showTotal && (
        <div
          className="absolute z-10 pointer-events-none text-center"
          style={{
            left: "50%",
            top: chartDimensions.centerY,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-xl font-bold text-gray-800 leading-tight">
            {total.toLocaleString("id-ID")}
          </div>
          <div className="text-xs text-gray-600 mt-1">TOTAL</div>
        </div>
      )}

      <ReactECharts
        option={getChartOptions()}
        style={{
          height: "100%",
          width: "100%",
          minHeight: "200px", // Minimum height untuk mencegah chart terlalu kecil
        }}
        opts={{
          renderer: "canvas", // Lebih performant untuk pie charts
        }}
        notMerge={true}
        onEvents={onEvents}
      />
    </div>
  );
}
