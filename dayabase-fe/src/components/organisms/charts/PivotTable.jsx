import {
  useMemo,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { AgGridReact } from "ag-grid-react";
import * as XLSX from "xlsx";

const PivotTable = forwardRef(
  ({ data, savedState, onStateChange, isDashboard = false }, ref) => {
    const gridRef = useRef();

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
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
      }));
    }, [data]);

    const getGridState = useCallback(() => {
      if (gridRef.current?.api) {
        const colState = gridRef.current.api.getColumnState();
        const groupState = gridRef.current.api.getColumnGroupState();
        const filterState = gridRef.current.api.getFilterModel();
        return { colState, groupState, filterState };
      }
      return null;
    }, []);

    const handleStateChange = useCallback(() => {
      if (onStateChange) {
        const currentState = getGridState();
        if (currentState) onStateChange(currentState);
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
          const value = node.data[col.getColDef().field];
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

    return (
      // Container dibuat fleksibel untuk mengisi ruang yang diberikan oleh parent
      <div className="h-full w-full flex flex-col">
        <div className="ag-theme-alpine flex-grow">
          <AgGridReact
            ref={gridRef}
            rowData={data}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            sideBar={!isDashboard}
            rowGroupPanelShow="always"
            pivotPanelShow="always"
            onGridReady={onGridReady}
            onFilterChanged={onStateChange ? handleStateChange : undefined}
            onSortChanged={onStateChange ? handleStateChange : undefined}
            onColumnMoved={onStateChange ? handleStateChange : undefined}
            onColumnRowGroupChanged={
              onStateChange ? handleStateChange : undefined
            }
          />
        </div>
      </div>
    );
  }
);

export default PivotTable;
