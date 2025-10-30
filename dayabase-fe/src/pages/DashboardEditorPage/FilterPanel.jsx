// pages/DashboardEditorPage/FilterPanel.jsx
import { useState, useEffect } from "react";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiPencilLine,
  RiAddCircleLine,
  RiCloseCircleLine,
} from "react-icons/ri";
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
  const [localFilterValues, setLocalFilterValues] = useState({});

  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [editingFilterId, setEditingFilterId] = useState(null);
  const [newFilterName, setNewFilterName] = useState("");
  const [newFilterDisplayName, setNewFilterDisplayName] = useState("");
  const [newFilterType, setNewFilterType] = useState("text");
  const [newFilterOptions, setNewFilterOptions] = useState([]);
  const [optionInput, setOptionInput] = useState("");

  const dispatch = useDispatch();

  useEffect(() => {
    setLocalFilterValues(filterValues);
  }, [filterValues]);

  const handleFilterValueChange = (filterName, value) => {
    setLocalFilterValues((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleApplyFilters = () => {
    onFilterValuesChange(localFilterValues);
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setNewFilterOptions([...newFilterOptions, optionInput.trim()]);
      setOptionInput("");
    }
  };

  const handleRemoveOption = (index) => {
    setNewFilterOptions(newFilterOptions.filter((_, i) => i !== index));
  };

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

    // Validate select type has options
    if (newFilterType === "select" && newFilterOptions.length === 0) {
      dispatch(
        addToast({
          message: "Select type filter requires at least one option",
          type: "error",
        })
      );
      return;
    }

    try {
      const payload = {
        name: newFilterName.trim(),
        display_name: newFilterDisplayName.trim(),
        type: newFilterType,
      };

      // Only include options for select type
      if (newFilterType === "select") {
        payload.options = newFilterOptions;
      }

      const response = await API.post(
        `/api/dashboards/${dashboardId}/filters`,
        payload
      );

      onFiltersChange([...filters, response.data]);
      resetForm();

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

    if (newFilterType === "select" && newFilterOptions.length === 0) {
      dispatch(
        addToast({
          message: "Select type filter requires at least one option",
          type: "error",
        })
      );
      return;
    }

    try {
      const payload = {
        name: newFilterName.trim(),
        display_name: newFilterDisplayName.trim(),
        type: newFilterType,
      };

      if (newFilterType === "select") {
        payload.options = newFilterOptions;
      }

      const response = await API.put(
        `/api/dashboards/${dashboardId}/filters/${filterId}`,
        payload
      );

      onFiltersChange(
        filters.map((f) => (f.id === filterId ? response.data : f))
      );

      resetForm();

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
    setNewFilterOptions(filter.options || []);
  };

  const resetForm = () => {
    setEditingFilterId(null);
    setIsAddingFilter(false);
    setNewFilterName("");
    setNewFilterDisplayName("");
    setNewFilterType("text");
    setNewFilterOptions([]);
    setOptionInput("");
  };

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

  const renderFilterInput = (filter) => {
    switch (filter.type) {
      case "boolean":
        return (
          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              checked={
                localFilterValues[filter.name] === "true" ||
                localFilterValues[filter.name] === true
              }
              onChange={(e) =>
                handleFilterValueChange(
                  filter.name,
                  e.target.checked.toString()
                )
              }
              className="w-4 h-4 rounded border-gray-300 text-primary-light focus:ring-primary-light"
            />
            <span className="text-sm text-gray-600">
              {localFilterValues[filter.name] === "true" ||
              localFilterValues[filter.name] === true
                ? "Yes"
                : "No"}
            </span>
          </div>
        );

      case "select":
        return (
          <select
            value={localFilterValues[filter.name] || ""}
            onChange={(e) =>
              handleFilterValueChange(filter.name, e.target.value)
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-light focus:ring-primary-light"
          >
            <option value="">-- Select {filter.display_name} --</option>
            {(filter.options || []).map((option, index) => (
              <option
                key={index}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <Input
            type={filter.type}
            placeholder={`Enter ${filter.display_name.toLowerCase()}`}
            value={localFilterValues[filter.name] || ""}
            onChange={(e) =>
              handleFilterValueChange(filter.name, e.target.value)
            }
          />
        );
    }
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
        <div className="bg-gray-50 p-3 rounded-md mb-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Variable Name
              </label>
              <Input
                placeholder="e.g., is_active"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <Input
                placeholder="e.g., Is Active"
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
                onChange={(e) => {
                  setNewFilterType(e.target.value);
                  setNewFilterOptions([]); // Reset options saat ganti type
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-light focus:ring-primary-light"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean (Yes/No)</option>
                <option value="select">Dropdown</option>
              </select>
            </div>
          </div>

          {/* Options input for Select type */}
          {newFilterType === "select" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dropdown Options
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Enter option (e.g., Active)"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddOption}
                  type="button"
                >
                  <RiAddCircleLine className="mr-1" /> Add
                </Button>
              </div>
              {newFilterOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newFilterOptions.map((option, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {option}
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="hover:text-red-600"
                        type="button"
                      >
                        <RiCloseCircleLine />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

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
              onClick={resetForm}
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
                  {filter.type === "boolean" && (
                    <span className="text-xs text-gray-400 ml-1">
                      - Checkbox
                    </span>
                  )}
                  {filter.type === "select" && (
                    <span className="text-xs text-gray-400 ml-1">
                      - Dropdown
                    </span>
                  )}
                </label>
                {renderFilterInput(filter)}
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
