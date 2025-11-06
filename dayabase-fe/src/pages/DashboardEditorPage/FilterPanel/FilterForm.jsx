// pages/DashboardEditorPage/FilterPanel/FilterForm.jsx
// Form for adding/editing filters

import { useState, useEffect } from "react";
import Input from "components/atoms/Input";
import Button from "components/atoms/Button";
import Select from "components/atoms/Select";
import { RiAddCircleLine, RiCloseCircleLine } from "react-icons/ri";
import {
  OPERATOR_OPTIONS,
  FILTER_TYPES,
  getDefaultOperator,
} from "./FilterOperators";

export default function FilterForm({
  editingFilter = null,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    type: "text",
    operator: "=",
    options: [],
  });
  const [optionInput, setOptionInput] = useState("");

  // Initialize form when editing
  useEffect(() => {
    if (editingFilter) {
      setFormData({
        name: editingFilter.name,
        displayName: editingFilter.display_name,
        type: editingFilter.type,
        operator: editingFilter.operator || "=",
        options: editingFilter.options || [],
      });
    }
  }, [editingFilter]);

  const handleTypeChange = (newType) => {
    let currentOptions = [];
    if (newType === "select" || newType === "multi-select") {
      currentOptions = editingFilter.options || [];
    }
    getDefaultOperator(newType);

    setFormData({
      ...formData,
      type: newType,
      operator: getDefaultOperator(newType),
      options: currentOptions,
    });
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setFormData({
        ...formData,
        options: [...formData.options, optionInput.trim()],
      });
      setOptionInput("");
    }
  };

  const handleRemoveOption = (index) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <form
      className="bg-gray-50 p-3 rounded-md mb-3 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      autoComplete="off"
    >
      <div className="grid grid-cols-4 gap-2">
        {/* Variable Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Variable Name
          </label>
          <Input
            placeholder="e.g., salary_min"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <Input
            placeholder="e.g., Minimum Salary"
            value={formData.displayName}
            onChange={(e) =>
              setFormData({ ...formData, displayName: e.target.value })
            }
            required
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Type
          </label>
          <Select
            value={formData.type}
            onChange={handleTypeChange}
            options={FILTER_TYPES}
            placeholder="Select filter type..."
            className="text-sm"
          />
        </div>

        {/* Operator */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Operator
          </label>
          <Select
            value={formData.operator}
            onChange={(value) => setFormData({ ...formData, operator: value })}
            options={OPERATOR_OPTIONS[formData.type]}
            placeholder="Select operator..."
            className="text-sm"
            disabled={formData.type === "boolean"}
          />
        </div>
      </div>

      {/* Options for Select/Multi-Select type */}
      {(formData.type === "select" || formData.type === "multi-select") && (
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

          {formData.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.options.map((option, index) => (
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

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          type="submit"
        >
          {editingFilter ? "Update" : "Add"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
