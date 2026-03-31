// utils/sqlParser.js

/**
 * Parse SQL string with variables and optional clauses.
 * @param {string} sql - Raw SQL containing {{variable}} and [[...]] syntax.
 * @param {object} parameters - Object containing filter values, e.g., { "category": "Electronics" }.
 * @param {string} dbType - Database type ("postgres" or "mysql") for placeholder syntax.
 * @returns {{finalSql: string, queryValues: any[]}}
 */
function parseSqlWithParameters(sql, parameters = {}, dbType) {
  const queryValues = [];
  let pgParamIndex = 1;

  // 1. Handle optional clauses [[...]]
  // Regex to find [[...]] blocks and check their inner variables.
  const sqlAfterOptional = sql.replace(
    /\[\[([\s\S]*?)\]\]/g,
    (match, innerContent) => {
      // Find all {{...}} placeholders INSIDE this optional block
      const placeholders = innerContent.match(/\{\{([\w_]+)\}\}/g) || [];

      if (placeholders.length === 0) {
        // Static block (e.g., [[AND 1=1]]), keep it.
        return innerContent;
      }

      // Check if ALL placeholders in this block have a value (not null/undefined/'')
      const allValid = placeholders.every((placeholder) => {
        const varName = placeholder.replace(/[{}]/g, ""); // Extract "category" from "{{category}}"
        const value = parameters[varName];
        // Consider empty string as invalid, but allow boolean false and number 0
        if (value === null || value === undefined || value === "") {
          return false;
        }
        return true;
      });

      // If all valid, return inner content (without [[...]]). Otherwise, remove the whole block.
      return allValid ? innerContent : "";
    }
  );

  // 2. Handle remaining {{...}} placeholders and replace them with safe placeholders
  const finalSql = sqlAfterOptional.replace(
    /\{\{([\w_]+)\}\}/g,
    (match, varName) => {
      const value = parameters[varName];

      // Allow boolean false and number 0, but reject null, undefined, and empty string
      if (value === null || value === undefined || value === "") {
        throw new Error(`Missing required parameter value for: {{${varName}}}`);
      }

      // Convert boolean values to PostgreSQL boolean format
      let finalValue = value;
      if (value === "true" || value === true) {
        finalValue = true;
      } else if (value === "false" || value === false) {
        finalValue = false;
      }

      // Add value to values array
      queryValues.push(finalValue);

      // Return the correct placeholder syntax for the database driver
      if (dbType === "postgres") {
        return `${pgParamIndex++}`;
      }
      return "?"; // Default to '?' for MySQL and others
    }
  );

  return { finalSql, queryValues };
}

module.exports = { parseSqlWithParameters };
