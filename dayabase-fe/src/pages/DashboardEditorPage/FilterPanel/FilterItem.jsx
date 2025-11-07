// pages/DashboardEditorPage/FilterPanel/FilterItem.jsx
// Single filter item with input and actions

import Input from "components/atoms/Input";
import Button from "components/atoms/Button";
import Select from "components/atoms/Select";
import { RiFileCopyLine, RiPencilLine, RiDeleteBinLine } from "react-icons/ri";
import { cn } from "lib/utils";
import { getOperatorLabel, generateSQLTemplate } from "./FilterOperators";

export default function FilterItem({
  filter,
  value,
  onChange,
  onCopyTemplate,
  onEdit,
  onDelete,
  isEmbedMode,
}) {
  const operator = filter.operator || "=";

  const renderInput = () => {
    // Boolean type
    if (filter.type === "boolean") {
      return (
        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            checked={
              value[filter.name] === "true" || value[filter.name] === true
            }
            onChange={(e) => onChange(filter.name, e.target.checked.toString())}
            className="w-4 h-4 rounded border-gray-300 text-primary-light focus:ring-primary-light"
          />
          <span className="text-sm text-gray-600">
            {value[filter.name] === "true" || value[filter.name] === true
              ? "Yes"
              : "No"}
          </span>
        </div>
      );
    }

    // Select type (single)
    if (filter.type === "select") {
      return (
        <Select
          value={value[filter.name] || ""}
          onChange={(val) => onChange(filter.name, val)}
          options={(filter.options || []).map((option) => ({
            value: option,
            label: option,
          }))}
          placeholder={`-- Select ${filter.display_name} --`}
          className="text-sm"
        />
      );
    }

    // Multi-select type
    if (filter.type === "multi-select") {
      return (
        <Select
          value={value[filter.name] || []}
          onChange={(val) => onChange(filter.name, val)}
          options={(filter.options || []).map((option) => ({
            value: option,
            label: option,
          }))}
          placeholder={`-- Select ${filter.display_name} --`}
          className="text-sm"
          isMulti={true}
        />
      );
    }

    // BETWEEN operator - two inputs
    if (operator === "BETWEEN") {
      return (
        <div className="flex gap-2 items-center">
          <Input
            type={filter.type}
            placeholder="Min"
            value={value[`${filter.name}_min`] || ""}
            onChange={(e) => onChange(`${filter.name}_min`, e.target.value)}
            className="flex-1"
          />
          <span className="text-sm text-gray-600">to</span>
          <Input
            type={filter.type}
            placeholder="Max"
            value={value[`${filter.name}_max`] || ""}
            onChange={(e) => onChange(`${filter.name}_max`, e.target.value)}
            className="flex-1"
          />
        </div>
      );
    }

    // IN operator - textarea
    if (operator === "IN") {
      return (
        <textarea
          placeholder="Enter values, one per line or comma-separated"
          value={value[filter.name] || ""}
          onChange={(e) => onChange(filter.name, e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-light focus:ring-primary-light text-sm"
          rows={3}
        />
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

    // Default - single input
    return (
      <Input
        type={filter.type}
        placeholder={`Enter ${filter.display_name.toLowerCase()}`}
        value={value[filter.name] || ""}
        onChange={(e) => onChange(filter.name, e.target.value)}
        className="w-full"
      />
    );
  };

  // Ini adalah class dasar untuk setiap item filter agar bisa flex-wrap
  const baseWrapperClasses = "flex-1 min-w-[200px] md:min-w-[240px]";

  // Tampilan "Ringan" untuk mode Embed / Tampil
  if (isEmbedMode) {
    return (
      <div className={cn("space-y-1", baseWrapperClasses)}>
        <label className="block text-sm font-medium text-gray-700">
          {filter.display_name}
        </label>
        <div>{renderInput()}</div>
      </div>
    );
  }

  // Tampilan "Berat" untuk mode Edit
  return (
    <div
      className={cn(
        "border border-gray-200 rounded-md p-3 space-y-2",
        baseWrapperClasses
      )}
    >
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {filter.display_name}
          <span className="text-xs text-gray-500 ml-1">({filter.name})</span>
          <span className="text-xs text-blue-600 ml-1">
            [{getOperatorLabel(operator)}]
          </span>
        </label>

        {!isEmbedMode && (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onCopyTemplate(filter)}
              title="Copy SQL template"
            >
              <RiFileCopyLine className="text-blue-500" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(filter)}
              title="Edit filter"
            >
              <RiPencilLine />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(filter.id)}
              title="Delete filter"
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
      <div>{renderInput()}</div>
    </div>
  );
}
