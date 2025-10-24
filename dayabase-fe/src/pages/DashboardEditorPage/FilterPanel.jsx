// pages/DashboardEditorPage/FilterPanel.jsx
import { useState } from "react";
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
  isEmbedMode,
}) {
  const [filterValues, setFilterValues] = useState({});
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [editingFilterId, setEditingFilterId] = useState(null);
  const [newFilterName, setNewFilterName] = useState("");
  const [newFilterDisplayName, setNewFilterDisplayName] = useState("");
  const [newFilterType, setNewFilterType] = useState("text");

  const dispatch = useDispatch();

  const handleFilterValueChange = (filterName, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleAddFilter = async () => {
    if (!newFilterName || !newFilterDisplayName) {
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
          name: newFilterName,
          display_name: newFilterDisplayName,
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
      dispatch(
        addToast({
          message: "Failed to add filter",
          type: "error",
        })
      );
    }
  };

  const handleUpdateFilter = async (filterId) => {
    try {
      const response = await API.put(
        `/api/dashboards/${dashboardId}/filters/${filterId}`,
        {
          name: newFilterName,
          display_name: newFilterDisplayName,
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
      dispatch(
        addToast({
          message: "Failed to update filter",
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

      dispatch(
        addToast({
          message: "Filter deleted successfully",
          type: "success",
        })
      );
    } catch (error) {
      dispatch(
        addToast({
          message: "Failed to delete filter",
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

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">Dashboard Filters</h3>
        {!isEmbedMode && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingFilter(true)}
          >
            <RiAddLine className="mr-1" /> Add Filter
          </Button>
        )}
      </div>

      {/* Filter Input Form (Add/Edit) */}
      {!isEmbedMode && (isAddingFilter || editingFilterId) && (
        <div className="bg-gray-50 p-3 rounded-md mb-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Variable name (e.g., kategori)"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
            />
            <Input
              placeholder="Display name (e.g., Category)"
              value={newFilterDisplayName}
              onChange={(e) => setNewFilterDisplayName(e.target.value)}
            />
            <select
              value={newFilterType}
              onChange={(e) => setNewFilterType(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
            </select>
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
        <p className="text-gray-500 text-sm">No filters configured yet.</p>
      ) : (
        <div className="space-y-2">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center gap-2"
            >
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.display_name}
                </label>
                <Input
                  type={filter.type}
                  placeholder={`Enter ${filter.display_name.toLowerCase()}`}
                  value={filterValues[filter.name] || ""}
                  onChange={(e) =>
                    handleFilterValueChange(filter.name, e.target.value)
                  }
                />
              </div>
              {!isEmbedMode && (
                <div className="flex gap-1 mt-6">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditFilter(filter)}
                  >
                    <RiPencilLine />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteFilter(filter.id)}
                  >
                    <RiDeleteBinLine className="text-red-500" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tombol Apply Filter - muncul untuk embed mode dan edit mode */}
      {filters.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <Button
            size="sm"
            variant="success"
            className="w-full"
          >
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}
