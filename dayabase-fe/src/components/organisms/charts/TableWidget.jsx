// components/organisms/charts/PivotTable.jsx
// Centralized navigation logic - parents just pass config, no handlers!
import {
  useMemo,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { formatDateCell } from "lib/utils";

const TableWidget = forwardRef(
  (
    {
      data,
      savedState,
      onStateChange,
      isDashboard = false,
      clickBehavior = null,
    },
    ref
  ) => {
    const gridRef = useRef();
    const navigate = useNavigate();
    const { token } = useParams();
    const location = useLocation();

    const isEmbedMode = location.pathname.includes("/embed/");

    const defaultColDef = useMemo(
      () => ({
        sortable: true,
        resizable: true,
        filter: true,
        flex: 1,
        minWidth: 120,
      }),
      []
    );

    const columnDefs = useMemo(() => {
      if (!data || data.length === 0) return [];
      const keys = Object.keys(data[0]);
      return keys.map((key) => ({
        headerName:
          key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        field: key,
        valueFormatter: (params) => formatDateCell(params.value),
      }));
    }, [data]);

    const getGridState = useCallback(() => {
      if (gridRef.current?.api) {
        const colState = gridRef.current.api.getColumnState();
        const filterState = gridRef.current.api.getFilterModel();
        return { colState, filterState };
      }
      return null;
    }, []);

    const handleStateChange = useCallback(() => {
      if (onStateChange) {
        const gridState = getGridState();
        if (gridState) {
          onStateChange((prevConfig) => ({
            ...prevConfig,
            ...gridState,
          }));
        }
      }
    }, [getGridState, onStateChange]);

    const onGridReady = useCallback(
      (params) => {
        if (savedState && typeof savedState === "object" && params.api) {
          if (savedState.colState)
            params.api.applyColumnState({
              state: savedState.colState,
              applyOrder: true,
            });
          if (savedState.groupState)
            params.api.setColumnGroupState(savedState.groupState);
          if (savedState.filterState)
            params.api.setFilterModel(savedState.filterState);
        }
      },
      [savedState]
    );

    const handleRowClick = useCallback(
      (event) => {
        // if selecting text, do not trigger click
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          return;
        }

        if (!clickBehavior || !clickBehavior.enabled) return;

        const rowData = event.data;
        if (!rowData) return;

        const { action, target_id, parameter_mappings } = clickBehavior;

        // Build Query String from multiple mappings
        const params = new URLSearchParams();

        if (parameter_mappings && Array.isArray(parameter_mappings)) {
          parameter_mappings.forEach((mapping) => {
            const val = rowData[mapping.passColumn];
            if (val !== undefined && val !== null) {
              params.append(mapping.targetParam, val);
            }
          });
        }

        const queryString = params.toString();
        let targetUrl;

        if (action === "link_to_question") {
          if (isEmbedMode && token) {
            targetUrl = `/embed/dashboards/${token}/questions/${target_id}/view?${queryString}`;
          } else {
            targetUrl = `/questions/${target_id}/view?${queryString}`;
          }
        } else if (action === "link_to_dashboard") {
          if (isEmbedMode && token) {
            const targetToken = clickBehavior.target_token;

            if (targetToken) {
              targetUrl = `/embed/dashboards/${targetToken}?${queryString}`;
            } else {
              alert(
                "Dashboard tujuan belum dipublikasikan (Sharing not enabled)."
              );
              return;
            }
          } else {
            targetUrl = `/dashboards/${target_id}?${queryString}`;
          }
        } else if (action === "link_to_url") {
          let finalUrl = clickBehavior.target_url;
          if (finalUrl) {
            finalUrl = finalUrl.replace("{{value}}", event.value);
            window.open(finalUrl, "_blank");
            return;
          }
        }

        if (targetUrl) {
          if (isEmbedMode && isDashboard) {
            // window.open(targetUrl, "_blank"); // Optional: Open in new tab
            navigate(targetUrl);
          } else {
            // Pass state 'from' for back button logic
            navigate(targetUrl, {
              state: {
                from: location.pathname + location.search,
                label: "Back to Previous Dashboard",
              },
            });
          }
        }
      },
      [clickBehavior, navigate, isEmbedMode, token, isDashboard, location]
    );

    const onBtnExport = useCallback(() => {
      if (!XLSX) {
        alert(
          "XLSX library not loaded. Please check the CDN link in your HTML."
        );
        return;
      }

      const api = gridRef.current?.api;
      if (!api) {
        console.error("Grid API not available.");
        alert("Export failed: Grid is not ready.");
        return;
      }

      const dataToExport = [];
      const columnHeaders = [];
      const visibleColumns = api
        .getAllGridColumns()
        .filter(
          (col) => col.isVisible() && col.getColId() !== "ag-Grid-AutoColumn"
        );

      visibleColumns.forEach((col) => {
        const colDef = col.getColDef();
        columnHeaders.push(colDef.headerName || colDef.field);
      });
      dataToExport.push(columnHeaders);

      api.forEachNodeAfterFilterAndSort((node) => {
        if (node.group) return;
        const rowData = [];
        visibleColumns.forEach((col) => {
          // Ambil raw value
          const value = node.data[col.getColDef().field];

          // NOTE: Jika ingin hasil export Excel juga terformat tanggalnya:
          // const formattedValue = formatDateCell(value);
          // rowData.push(formattedValue);

          // Saat ini kita push raw value agar di Excel tetap dikenali sebagai data (bukan teks)
          rowData.push(value !== null && value !== undefined ? value : "");
        });
        dataToExport.push(rowData);
      });

      const ws = XLSX.utils.aoa_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PivotData");
      XLSX.writeFile(wb, "dayabase_pivot_export.xlsx");
    }, []);

    // Expose the export function to parent components via ref
    useImperativeHandle(ref, () => ({
      exportToExcel: onBtnExport,
    }));

    // Add cursor pointer style if clickable
    const rowClass = clickBehavior?.enabled ? "cursor-pointer" : "";

    return (
      <div className="h-full w-full flex flex-col">
        <div className="ag-theme-alpine flex-grow">
          <AgGridReact
            ref={gridRef}
            rowData={data}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onFilterChanged={onStateChange ? handleStateChange : undefined}
            onSortChanged={onStateChange ? handleStateChange : undefined}
            onColumnMoved={onStateChange ? handleStateChange : undefined}
            onColumnRowGroupChanged={
              onStateChange ? handleStateChange : undefined
            }
            onRowClicked={clickBehavior?.enabled ? handleRowClick : undefined}
            rowClass={rowClass}
            enableBrowserTooltips={true}
            enableCellTextSelection={true}
            ensureDomOrder={true}
          />
        </div>
      </div>
    );
  }
);

export default TableWidget;
