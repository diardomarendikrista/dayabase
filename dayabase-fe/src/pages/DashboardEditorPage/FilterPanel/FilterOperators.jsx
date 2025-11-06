export const OPERATOR_OPTIONS = {
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
  "multi-select": [
    { value: "IN", label: "In (Any of)" },
    { value: "NOT IN", label: "Not In (None of)" },
  ],
};

export const FILTER_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "select", label: "Dropdown (Single)" },
  { value: "multi-select", label: "Dropdown (Multiple)" },
];

/**
 * Get operator label from value
 */
export const getOperatorLabel = (operator) => {
  const allOperators = Object.values(OPERATOR_OPTIONS).flat();
  const found = allOperators.find((op) => op.value === operator);
  return found ? found.label : operator;
};

/**
 * Get default operator for filter type
 */
export const getDefaultOperator = (type) => {
  if (type === "number" || type === "date") {
    return ">=";
  } else if (type === "text") {
    return "LIKE";
  } else if (type === "multi-select") {
    return "IN";
  }
  return "=";
};

/**
 * Generate SQL template for filter
 */
export const generateSQLTemplate = (filter) => {
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
