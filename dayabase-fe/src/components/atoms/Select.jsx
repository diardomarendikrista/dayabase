import { cn } from "lib/utils";
import { useId, useMemo } from "react";
import ReactSelect from "react-select";

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "40px",
    border: state.isFocused ? "1px solid #6366f1" : "1px solid #d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #6366f1" : "none",
    borderRadius: "0.375rem",
    "&:hover": {
      borderColor: state.isFocused ? "#6366f1" : "#9ca3af",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#6366f1"
      : state.isFocused
        ? "#eef2ff"
        : "white",
    color: state.isSelected ? "white" : "#111827",
    "&:active": {
      backgroundColor: "#4f46e5",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
  }),
};

export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select an option...",
  className,
  ...props
}) {
  const id = useId();

  const selectedValue = useMemo(
    () => options.find((opt) => opt.value === value) || null,
    [options, value]
  );

  const handleChange = (selectedOption) => {
    onChange(selectedOption ? selectedOption.value : null);
  };

  return (
    <div>
      {label && (
        <label
          htmlFor={props.id || id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <ReactSelect
        options={options}
        value={selectedValue}
        onChange={handleChange}
        placeholder={placeholder}
        styles={customStyles}
        className={cn("w-full", className)}
        {...props}
      />
    </div>
  );
}
