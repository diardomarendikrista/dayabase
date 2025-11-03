// utils/sqlGenerator.js
// Auto-generate SQL WHERE clauses from filters

/**
 * Generate SQL WHERE clause for a single filter based on its operator
 * @param {Object} filter - Filter object with name, type, operator
 * @param {Object} parameters - Current filter values
 * @returns {string|null} SQL clause or null if filter not applicable
 */
function generateFilterClause(filter, parameters) {
  const { name, operator, type } = filter;
  const value = parameters[name];

  // Skip if no value (except for IS NULL checks)
  if (
    (value === undefined || value === null || value === "") &&
    operator !== "IS NULL" &&
    operator !== "IS NOT NULL"
  ) {
    return null;
  }

  switch (operator) {
    case "=":
    case "!=":
    case ">":
    case ">=":
    case "<":
    case "<=":
      return `[[AND ${name} ${operator} {{${name}}}]]`;

    case "BETWEEN":
      // For BETWEEN, we need two values: min and max
      const minValue = parameters[`${name}_min`];
      const maxValue = parameters[`${name}_max`];
      if (!minValue || !maxValue) return null;
      return `[[AND ${name} BETWEEN {{${name}_min}} AND {{${name}_max}}]]`;

    case "LIKE":
      // ILIKE for case-insensitive (PostgreSQL)
      return `[[AND ${name} ILIKE '%' || {{${name}}} || '%']]`;

    case "NOT LIKE":
      return `[[AND ${name} NOT ILIKE '%' || {{${name}}} || '%']]`;

    case "IN":
      // For IN operator with multiple values
      // Value should be comma or newline separated
      if (!value) return null;
      return `[[AND ${name} IN ({{${name}}})]]`;

    case "IS NULL":
      return `AND ${name} IS NULL`;

    case "IS NOT NULL":
      return `AND ${name} IS NOT NULL`;

    default:
      // Default to equals
      return `[[AND ${name} = {{${name}}}]]`;
  }
}

/**
 * Auto-generate complete SQL query with filters
 * @param {string} baseQuery - Original SQL query
 * @param {Array} filters - Array of filter objects
 * @param {Object} parameters - Current filter values
 * @returns {string} Complete SQL with WHERE clauses
 */
function generateQueryWithFilters(baseQuery, filters = [], parameters = {}) {
  if (!filters || filters.length === 0) {
    return baseQuery;
  }

  // Generate WHERE clauses for all filters
  const whereClauses = filters
    .map((filter) => generateFilterClause(filter, parameters))
    .filter(Boolean) // Remove null clauses
    .join("\n");

  if (!whereClauses) {
    return baseQuery; // No active filters
  }

  // Check if base query already has WHERE clause
  const hasWhere = /\bWHERE\b/i.test(baseQuery);

  if (hasWhere) {
    // Append to existing WHERE
    return `${baseQuery.trim()}\n${whereClauses}`;
  } else {
    // Add new WHERE clause
    return `${baseQuery.trim()}\nWHERE 1=1\n${whereClauses}`;
  }
}

/**
 * Process IN operator values - split by comma or newline
 * @param {string} value - Raw input value
 * @returns {Array} Array of values
 */
function processInValues(value) {
  if (!value) return [];
  return value
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

module.exports = {
  generateFilterClause,
  generateQueryWithFilters,
  processInValues,
};
