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

  // 1. Menangani klausa opsional [[...]]
  // Regex ini mencari blok [[...]] dan mengecek variabel di dalamnya.
  const sqlAfterOptional = sql.replace(
    /\[\[([\s\S]*?)\]\]/g,
    (match, innerContent) => {
      // Temukan semua placeholder {{...}} DI DALAM blok opsional ini
      const placeholders = innerContent.match(/\{\{([\w_]+)\}\}/g) || [];

      if (placeholders.length === 0) {
        // Ini blok statis, misal [[AND 1=1]], pertahankan.
        return innerContent;
      }

      // Cek apakah SEMUA placeholder di dalam blok ini memiliki nilai (bukan null/undefined/'')
      const allValid = placeholders.every((placeholder) => {
        const varName = placeholder.replace(/[{}]/g, ""); // Dapatkan "kategori" dari "{{kategori}}"
        const value = parameters[varName];
        // Consider empty string as invalid, but allow boolean false and number 0
        if (value === null || value === undefined || value === "") {
          return false;
        }
        return true;
      });

      // Jika semua valid, kembalikan kontennya (tanpa [[...]]). Jika tidak, hapus seluruh blok.
      return allValid ? innerContent : "";
    }
  );

  // 2. Menangani placeholder variabel {{...}} yang tersisa dan menggantinya dengan placeholder aman
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

      // Tambahkan nilai ke array values
      queryValues.push(finalValue);

      // Kembalikan sintaks placeholder yang benar untuk driver database
      if (dbType === "postgres") {
        return `${pgParamIndex++}`;
      }
      return "?"; // Default ke '?' untuk MySQL dan lainnya
    }
  );

  return { finalSql, queryValues };
}

module.exports = { parseSqlWithParameters };
