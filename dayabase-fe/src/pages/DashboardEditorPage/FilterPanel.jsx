// pages/DashboardEditorPage/FilterPanel.jsx
import { useState, useEffect } from "react";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";
import { RiAddLine, RiDeleteBinLine, RiPencilLine } from "react-icons/ri";
import { API } from "axios/axios";
import { useDispatch } from "react-redux";
import { addToast } from "store/slices/toastSlice";

export default function FilterPanel({
  dashboardId,
  filters,
  onFiltersChange,
  filterValues,
  onFilterValuesChange,
  isEmbedMode,
}) {
  // State lokal untuk input filter sebelum di-apply
  const [localFilterValues, setLocalFilterValues] = useState({});

  // State untuk form add/edit filter
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [editingFilterId, setEditingFilterId] = useState(null);
  const [newFilterName, setNewFilterName] = useState("");
  const [newFilterDisplayName, setNewFilterDisplayName] = useState("");
  const [newFilterType, setNewFilterType] = useState("text");

  const dispatch = useDispatch();

  // Sync localFilterValues dengan filterValues yang di-apply
  useEffect(() => {
    setLocalFilterValues(filterValues);
  }, [filterValues]);

  // Handler untuk mengubah nilai filter lokal (belum di-apply)
  const handleFilterValueChange = (filterName, value) => {
    setLocalFilterValues((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // Handler untuk apply filters ke parent
  const handleApplyFilters = () => {
    onFilterValuesChange(localFilterValues);
    // dispatch(
    //   addToast({
    //     message: "Filters applied successfully",
    //     type: "success",
    //   })
    // );
  };

  // add filter baru
  const handleAddFilter = async () => {
    if (!newFilterName.trim() || !newFilterDisplayName.trim()) {
      dispatch(
        addToast({
          message: "Filter name and display name are required",
          type: "error",
        })
      );
      return;
    }

    try {
      const response = await API.post(
        `/api/dashboards/${dashboardId}/filters`,
        {
          name: newFilterName.trim(),
          display_name: newFilterDisplayName.trim(),
          type: newFilterType,
        }
      );

      onFiltersChange([...filters, response.data]);
      setIsAddingFilter(false);
      setNewFilterName("");
      setNewFilterDisplayName("");
      setNewFilterType("text");

      dispatch(
        addToast({
          message: "Filter added successfully",
          type: "success",
        })
      );
    } catch (error) {
      console.error("Failed to add filter:", error);
      dispatch(
        addToast({
          message: error.response?.data?.message || "Failed to add filter",
          type: "error",
        })
      );
    }
  };

  const handleUpdateFilter = async (filterId) => {
    if (!newFilterName.trim() || !newFilterDisplayName.trim()) {
      dispatch(
        addToast({
          message: "Filter name and display name are required",
          type: "error",
        })
      );
      return;
    }

    try {
      const response = await API.put(
        `/api/dashboards/${dashboardId}/filters/${filterId}`,
        {
          name: newFilterName.trim(),
          display_name: newFilterDisplayName.trim(),
          type: newFilterType,
        }
      );

      onFiltersChange(
        filters.map((f) => (f.id === filterId ? response.data : f))
      );

      setEditingFilterId(null);
      setNewFilterName("");
      setNewFilterDisplayName("");
      setNewFilterType("text");

      dispatch(
        addToast({
          message: "Filter updated successfully",
          type: "success",
        })
      );
    } catch (error) {
      console.error("Failed to update filter:", error);
      dispatch(
        addToast({
          message: error.response?.data?.message || "Failed to update filter",
          type: "error",
        })
      );
    }
  };

  const handleDeleteFilter = async (filterId) => {
    if (!confirm("Are you sure you want to delete this filter?")) return;

    try {
      await API.delete(`/api/dashboards/${dashboardId}/filters/${filterId}`);
      onFiltersChange(filters.filter((f) => f.id !== filterId));

      // Hapus juga nilai filter yang sudah di-apply
      const newFilterValues = { ...filterValues };
      const deletedFilter = filters.find((f) => f.id === filterId);
      if (deletedFilter) {
        delete newFilterValues[deletedFilter.name];
        onFilterValuesChange(newFilterValues);
      }

      dispatch(
        addToast({
          message: "Filter deleted successfully",
          type: "success",
        })
      );
    } catch (error) {
      console.error("Failed to delete filter:", error);
      dispatch(
        addToast({
          message: error.response?.data?.message || "Failed to delete filter",
          type: "error",
        })
      );
    }
  };

  const startEditFilter = (filter) => {
    setEditingFilterId(filter.id);
    setNewFilterName(filter.name);
    setNewFilterDisplayName(filter.display_name);
    setNewFilterType(filter.type);
  };

  const cancelEdit = () => {
    setEditingFilterId(null);
    setIsAddingFilter(false);
    setNewFilterName("");
    setNewFilterDisplayName("");
    setNewFilterType("text");
  };

  // Handler untuk clear semua filter
  const handleClearFilters = () => {
    setLocalFilterValues({});
    onFilterValuesChange({});
    dispatch(
      addToast({
        message: "All filters cleared",
        type: "info",
      })
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">Dashboard Filters</h3>
        {!isEmbedMode && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingFilter(true)}
            disabled={isAddingFilter || editingFilterId !== null}
          >
            <RiAddLine className="mr-1" /> Add Filter
          </Button>
        )}
      </div>

      {/* Filter Input Form (Add/Edit) */}
      {!isEmbedMode && (isAddingFilter || editingFilterId) && (
        <div className="bg-gray-50 p-3 rounded-md mb-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Variable Name
              </label>
              <Input
                placeholder="e.g., kategori"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <Input
                placeholder="e.g., Category"
                value={newFilterDisplayName}
                onChange={(e) => setNewFilterDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={newFilterType}
                onChange={(e) => setNewFilterType(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-light focus:ring-primary-light"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                editingFilterId
                  ? handleUpdateFilter(editingFilterId)
                  : handleAddFilter()
              }
            >
              {editingFilterId ? "Update" : "Add"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEdit}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters List */}
      {filters.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No filters configured yet.{" "}
          {!isEmbedMode && "Click 'Add Filter' to create one."}
        </p>
      ) : (
        <div className="space-y-3">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-end gap-2"
            >
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.display_name}
                  <span className="text-xs text-gray-500 ml-1">
                    ({filter.name})
                  </span>
                </label>
                <Input
                  type={filter.type}
                  placeholder={`Enter ${filter.display_name.toLowerCase()}`}
                  value={localFilterValues[filter.name] || ""}
                  onChange={(e) =>
                    handleFilterValueChange(filter.name, e.target.value)
                  }
                />
              </div>
              {!isEmbedMode && (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditFilter(filter)}
                    title="Edit filter"
                    disabled={isAddingFilter || editingFilterId !== null}
                  >
                    <RiPencilLine />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteFilter(filter.id)}
                    title="Delete filter"
                    disabled={isAddingFilter || editingFilterId !== null}
                  >
                    <RiDeleteBinLine className="text-red-500" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
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
    </div>
  );
}
