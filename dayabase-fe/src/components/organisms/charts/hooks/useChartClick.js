import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Chart CLICK EVENT HANDLER
export const useChartClick = (clickBehavior) => {
  const navigate = useNavigate();
  const { token } = useParams();
  const isEmbedMode = !!token;

  const onChartClick = useCallback(
    (params) => {
      if (!clickBehavior || !clickBehavior.enabled) return;

      // Ambil nilai kategori yang diklik (90% kasus biasanya pakai Sumbu X aja)
      const clickedCategory = params.name;

      // untuk menyusun Parameter URL
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
        // External URL handling (jika ada)
        let finalUrl = target_url;
        // Simple string replacement for dynamic URL
        // misal https://google.com/search?q={{category}}
        if (finalUrl) {
          finalUrl = finalUrl.replace("{{value}}", clickedCategory);
          window.open(finalUrl, "_blank");
          return;
        }
      }

      if (targetUrl) {
        navigate(targetUrl);
      }
    },
    [clickBehavior, navigate, token, isEmbedMode]
  );

  return onChartClick;
};
