// pages/DashboardEditorPage/FilterPanel.jsx - WITH OPERATORS & SQL TEMPLATE COPY
import { useState, useEffect } from "react";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiPencilLine,
  RiAddCircleLine,
  RiCloseCircleLine,
  RiFileCopyLine,
} from "react-icons/ri";
import { API } from "axios/axios";
import { useDispatch } from "react-redux";
import { addToast } from "store/slices/toastSlice";
import { cn } from "lib/utils";
import Select from "components/atoms/Select";

// Operator options by filter type
const OPERATOR_OPTIONS = {
  text: [
    { value: "=", label: "Equals (=)" },
    { value: "!=", label: "Not Equals (≠)" },
    { value: "LIKE", label: "Contains" },
    { value: "NOT LIKE", label: "Not Contains" },
    { value: "IN", label: "In List" },
  ],
  number: [
    { value: "=", label: "Equals (=)" },
    { value: "!=", label: "Not Equals (≠)" },
    { value: ">", label: "Greater Than (>)" },
    { value: ">=", label: "Greater or Equal (≥)" },
    { value: "<", label: "Less Than (<)" },
    { value: "<=", label: "Less or Equal (≤)" },
    { value: "BETWEEN", label: "Between (Range)" },
  ],
  date: [
    { value: "=", label: "Equals (=)" },
    { value: "!=", label: "Not Equals (≠)" },
    { value: ">", label: "After (>)" },
    { value: ">=", label: "On or After (≥)" },
    { value: "<", label: "Before (<)" },
    { value: "<=", label: "On or Before (≤)" },
    { value: "BETWEEN", label: "Between (Range)" },
  ],
  boolean: [{ value: "=", label: "Equals (=)" }],
  select: [
    { value: "=", label: "Equals (=)" },
    { value: "!=", label: "Not Equals (≠)" },
  ],
};

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
  const [newFilterOperator, setNewFilterOperator] = useState("=");
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

  const handleTypeChange = (newType) => {
    setNewFilterType(newType);
    setNewFilterOptions([]);

    // Set default operator for new type
    if (newType === "number" || newType === "date") {
      setNewFilterOperator(">=");
    } else if (newType === "text") {
      setNewFilterOperator("LIKE");
    } else {
      setNewFilterOperator("=");
    }
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
        operator: newFilterOperator,
      };

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
        operator: newFilterOperator,
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
    setNewFilterOperator(filter.operator || "=");
    setNewFilterOptions(filter.options || []);
  };

  const resetForm = () => {
    setEditingFilterId(null);
    setIsAddingFilter(false);
    setNewFilterName("");
    setNewFilterDisplayName("");
    setNewFilterType("text");
    setNewFilterOperator("=");
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

  // Generate SQL template for filter
  const generateSQLTemplate = (filter) => {
    const operator = filter.operator || "=";

    if (operator === "BETWEEN") {
      return `[[AND ${filter.name} BETWEEN {{${filter.name}_min}} AND {{${filter.name}_max}}]]`;
    } else if (operator === "LIKE") {
      return `[[AND ${filter.name} ILIKE '%' || {{${filter.name}}} || '%']]`;
    } else if (operator === "NOT LIKE") {
      return `[[AND ${filter.name} NOT ILIKE '%' || {{${filter.name}}} || '%']]`;
    } else if (operator === "IN") {
      return `[[AND ${filter.name} IN ({{${filter.name}}})]]`;
    } else if (operator === "IS NULL") {
      return `AND ${filter.name} IS NULL`;
    } else if (operator === "IS NOT NULL") {
      return `AND ${filter.name} IS NOT NULL`;
    } else {
      // Default operators: =, !=, >, >=, <, <=
      return `[[AND ${filter.name} ${operator} {{${filter.name}}}]]`;
    }
  };

  const handleCopyTemplate = (filter) => {
    const template = generateSQLTemplate(filter);
    navigator.clipboard
      .writeText(template)
      .then(() => {
        dispatch(
          addToast({
            message: `SQL template copied: ${template}`,
            type: "success",
          })
        );
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        dispatch(
          addToast({
            message: "Failed to copy template",
            type: "error",
          })
        );
      });
  };

  const renderFilterInput = (filter) => {
    const operator = filter.operator || "=";

    // Boolean type
    if (filter.type === "boolean") {
      return (
        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            checked={
              localFilterValues[filter.name] === "true" ||
              localFilterValues[filter.name] === true
            }
            onChange={(e) =>
              handleFilterValueChange(filter.name, e.target.checked.toString())
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
    }

    // Select type
    if (filter.type === "select") {
      return (
        <div className={cn({ "flex gap-2": false })}>
          <Select
            value={localFilterValues[filter.name] || ""}
            onChange={(value) => handleFilterValueChange(filter.name, value)}
            options={(filter.options || []).map((option, index) => ({
              value: option,
              label: option,
            }))}
            placeholder={`-- Select ${filter.display_name} --`}
            className="text-sm"
          />
        </div>
      );
    }

    // BETWEEN operator - two inputs
    if (operator === "BETWEEN") {
      return (
        <div className="flex gap-2 items-center">
          <Input
            type={filter.type}
            placeholder="Min"
            value={localFilterValues[`${filter.name}_min`] || ""}
            onChange={(e) =>
              handleFilterValueChange(`${filter.name}_min`, e.target.value)
            }
            className="flex-1"
          />
          <span className="text-sm text-gray-600">to</span>
          <Input
            type={filter.type}
            placeholder="Max"
            value={localFilterValues[`${filter.name}_max`] || ""}
            onChange={(e) =>
              handleFilterValueChange(`${filter.name}_max`, e.target.value)
            }
            className="flex-1"
          />
        </div>
      );
    }

    // IN operator - textarea
    if (operator === "IN") {
      return (
        <div>
          <textarea
            placeholder="Enter values, one per line or comma-separated"
            value={localFilterValues[filter.name] || ""}
            onChange={(e) =>
              handleFilterValueChange(filter.name, e.target.value)
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-light focus:ring-primary-light text-sm"
            rows={3}
          />
        </div>
      );
    }

    // IS NULL / IS NOT NULL - no input
    if (operator === "IS NULL" || operator === "IS NOT NULL") {
      return (
        <div className="text-sm text-gray-600 italic py-2">
          No input required - will check for {operator.toLowerCase()} values
        </div>
      );
    }

    // Default - single input with operator
    return (
      <div className={cn({ "flex gap-2": false })}>
        <Input
          type={filter.type}
          placeholder={`Enter ${filter.display_name.toLowerCase()}`}
          value={localFilterValues[filter.name] || ""}
          onChange={(e) => handleFilterValueChange(filter.name, e.target.value)}
          className="flex-1"
        />
      </div>
    );
  };

  const getOperatorLabel = (operator) => {
    const allOperators = Object.values(OPERATOR_OPTIONS).flat();
    const found = allOperators.find((op) => op.value === operator);
    return found ? found.label : operator;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-4">
      {!isEmbedMode && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg">Dashboard Filters</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingFilter(true)}
            disabled={isAddingFilter || editingFilterId !== null}
          >
            <RiAddLine className="mr-1" /> Add Filter
          </Button>
        </div>
      )}

      {/* Filter Input Form (Add/Edit) */}
      {!isEmbedMode && (isAddingFilter || editingFilterId) && (
        <form
          className="bg-gray-50 p-3 rounded-md mb-3 space-y-3"
          onSubmit={(e) => e.preventDefault()}
          autoComplete="off"
        >
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Variable Name
              </label>
              <Input
                placeholder="e.g., salary_min"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <Input
                placeholder="e.g., Minimum Salary"
                value={newFilterDisplayName}
                onChange={(e) => setNewFilterDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <Select
                value={newFilterType}
                onChange={handleTypeChange}
                options={[
                  { value: "text", label: "Text" },
                  { value: "number", label: "Number" },
                  { value: "date", label: "Date" },
                  { value: "boolean", label: "Boolean" },
                  { value: "select", label: "Dropdown" },
                ]}
                placeholder="Select filter type..."
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Operator
              </label>
              <Select
                value={newFilterOperator}
                onChange={(value) => setNewFilterOperator(value)}
                options={OPERATOR_OPTIONS[newFilterType]?.map((op) => ({
                  value: op.value,
                  label: op.label,
                }))}
                placeholder="Select operator..."
                className="text-sm"
                disabled={newFilterType === "boolean"}
              />
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
                  placeholder="Enter option"
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
        </form>
      )}

      {/* Active Filters List */}
      {filters.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No filters configured yet.{" "}
          {!isEmbedMode && "Click 'Add Filter' to create one."}
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => e.preventDefault()}
          autoComplete="off"
        >
          {filters.map((filter) => (
            <div
              key={filter.id}
              className="border border-gray-200 rounded-md p-3 space-y-2"
            >
              {/* Filter Header with Actions */}
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  {filter.display_name}
                  <span className="text-xs text-gray-500 ml-1">
                    ({filter.name})
                  </span>
                  <span className="text-xs text-blue-600 ml-1">
                    [{getOperatorLabel(filter.operator)}]
                  </span>
                </label>
                {!isEmbedMode && (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCopyTemplate(filter)}
                      title="Copy SQL template"
                    >
                      <RiFileCopyLine className="text-blue-500" />
                    </Button>
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

              {/* SQL Template Preview (Collapsible) */}
              {!isEmbedMode && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700 select-none">
                    SQL Template
                  </summary>
                  <code className="block mt-1 p-2 bg-gray-100 rounded text-gray-700 font-mono break-all">
                    {generateSQLTemplate(filter)}
                  </code>
                </details>
              )}

              {/* Filter Input */}
              <div>{renderFilterInput(filter)}</div>
            </div>
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
    </div>
  );
}
