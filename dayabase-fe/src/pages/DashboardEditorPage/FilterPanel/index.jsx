// pages/DashboardEditorPage/FilterPanel/index.jsx
// Main FilterPanel component (Refactored)

import Button from "components/atoms/Button";
import { RiAddLine } from "react-icons/ri";
import FilterItem from "./FilterItem";
import { useFilterPanel } from "./useFilterPanel";
import ModalAddEditFilter from "./ModalAddEditFilter";

export default function FilterPanel({
  dashboardId,
  filters,
  onFiltersChange,
  filterValues,
  onFilterValuesChange,
  isEmbedMode,
}) {
  const {
    localFilterValues,
    showFilterModal,
    editingFilter,
    handleFilterValueChange,
    handleApplyFilters,
    handleClearFilters,
    handleFormSubmit,
    handleFormCancel,
    handleDeleteFilter,
    handleCopyTemplate,
    setShowFilterModal,
    setEditingFilter,
  } = useFilterPanel({
    dashboardId,
    filters,
    onFiltersChange,
    filterValues,
    onFilterValuesChange,
  });

  const handleAddClick = () => {
    setEditingFilter(null); // Pastikan mode "Add"
    setShowFilterModal(true);
  };

  const handleEditClick = (filter) => {
    setEditingFilter(filter); // Set filter yg di-edit
    setShowFilterModal(true);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-4">
      {/* Header */}
      {!isEmbedMode && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg">Dashboard Filters</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddClick} // <-- Ubah onClick
          >
            <RiAddLine className="mr-1" /> Add Filter
          </Button>
        </div>
      )}

      {/* Filters List */}
      {filters.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No filters configured yet.{" "}
          {!isEmbedMode && "Click 'Add Filter' to create one."}
        </p>
      ) : (
        <form
          className="flex flex-wrap gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleApplyFilters();
          }}
          autoComplete="off"
        >
          {filters.map((filter) => (
            <FilterItem
              key={filter.id}
              filter={filter}
              value={localFilterValues}
              onChange={handleFilterValueChange}
              onCopyTemplate={handleCopyTemplate}
              onEdit={handleEditClick}
              onDelete={handleDeleteFilter}
              isEmbedMode={isEmbedMode}
            />
          ))}
        </form>
      )}

      {/* Action Buttons */}
      {filters.length > 0 && (
        <div className="mt-4 pt-3 border-t flex gap-2">
          <Button
            size="sm"
            variant="success"
            className="flex-1"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearFilters}
          >
            Clear All
          </Button>
        </div>
      )}

      {!isEmbedMode && (
        <ModalAddEditFilter
          showModal={showFilterModal}
          setShowModal={setShowFilterModal}
          editingFilter={editingFilter}
          onSubmit={handleFormSubmit} // Pass handler dari hook
        />
      )}
    </div>
  );
}
