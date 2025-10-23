// utils/sqlParser.js

/**
 * Mem-parsing SQL string dengan variabel dan klausa opsional.
 * @param {string} sql - SQL mentah dengan sintaks {{variable}} dan [[...]].
 * @param {object} parameters - Objek berisi nilai filter, cth: { "kategori": "Elektronik" }.
 * @param {string} dbType - Tipe database ("postgres" atau "mysql") untuk sintaks placeholder.
 * @returns {{finalSql: string, queryValues: any[]}}
 */
function parseSqlWithParameters(sql, parameters = {}, dbType) {
  const queryValues = [];
  let pgParamIndex = 1;

  // Handle klausa opsional [[...]]
  const sqlAfterOptional = sql.replace(
    /\[\[([\s\S]*?)\]\]/g,
    (match, innerContent) => {
      const placeholders = innerContent.match(/\{\{([\w_]+)\}\}/g) || [];

      if (placeholders.length === 0) {
        return innerContent;
      }

      const allValid = placeholders.every((placeholder) => {
        const varName = placeholder.replace(/[{}]/g, "");
        return (
          parameters[varName] !== null && parameters[varName] !== undefined
        );
      });

      return allValid ? innerContent : "";
    }
  );

  // Handle placeholder variabel {{...}}
  const finalSql = sqlAfterOptional.replace(
    /\{\{([\w_]+)\}\}/g,
    (match, varName) => {
      const value = parameters[varName];

      if (value === undefined) {
        throw new Error(`Missing required parameter value for: {{${varName}}}`);
      }

      queryValues.push(value);

      if (dbType === "postgres") {
        return `$${pgParamIndex++}`;
      }
      return "?";
    }
  );

  return { finalSql, queryValues };
}

module.exports = { parseSqlWithParameters };
