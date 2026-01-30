const { decrypt } = require("../utils/crypto");
const { connectToDatabase } = require("../config/databaseConnector");
const pool = require("../config/db");
const { parseSqlWithParameters } = require("../utils/sqlParser");
const logger = require("../utils/logger");

class QueryService {
  /**
   * Run dynamic SQL query
   */
  async runQuery({ sql, connectionId, row_limit, parameters }) {
    // 1. Validation & Security Checks
    if (!sql || !connectionId) {
      throw new Error("sql and connectionId are required!");
    }

    const cleaned = sql.trim();
    if (cleaned.length > 50000) throw new Error("SQL too long.");
    if (cleaned.includes(";")) throw new Error("Multiple statements not allowed.");

    const sqlWithoutComments = cleaned
      .replace(/^\s*(\/\*[\s\S]*?\*\/|--.*(\r?\n|$))*/g, "")
      .trim();

    if (!/^(SELECT|WITH)\b/i.test(sqlWithoutComments)) {
      throw new Error("Only SELECT queries allowed.");
    }

    // 2. Fetch Connection Details
    const connDetailsResult = await pool.query(
      "SELECT * FROM database_connections WHERE id = $1",
      [connectionId]
    );

    if (connDetailsResult.rows.length === 0) {
      throw new Error("Connection configuration not found.");
    }

    const connDetails = connDetailsResult.rows[0];
    const dbType = connDetails.db_type;

    // 3. Parse SQL & Parameters
    const { finalSql, queryValues } = parseSqlWithParameters(
      sql,
      parameters || {},
      dbType
    );

    // 4. Enforce Limit
    const limit = Number.isInteger(row_limit) && row_limit > 0 ? row_limit : 1000;
    let execSql = finalSql;
    if (!/limit\s+\d+/i.test(sqlWithoutComments)) {
      execSql = `${finalSql.trim()} LIMIT ${limit}`;
    }

    // 5. Decrypt Password
    let decryptedPassword;
    try {
      decryptedPassword = decrypt(connDetails.password_encrypted);
    } catch (err) {
      logger.error("Failed to decrypt password:", err);
      throw new Error("Decryption failed.");
    }

    // 6. Connect & Execute
    const dbConfig = {
      dbType: connDetails.db_type,
      host: connDetails.host,
      port: connDetails.port,
      user: connDetails.db_user,
      database: connDetails.database_name,
      password: decryptedPassword,
    };

    let targetConnection;
    try {
      targetConnection = await connectToDatabase(dbConfig);
      let rows;

      switch (dbConfig.dbType) {
        case "postgres":
          const pgResult = await targetConnection.query(execSql, queryValues);
          rows = pgResult.rows;
          break;
        case "mysql":
          const [mysqlRows] = await targetConnection.execute(
            execSql,
            queryValues
          );
          rows = mysqlRows;
          break;
        default:
          throw new Error(
            `Execution logic for ${dbConfig.dbType} not implemented.`
          );
      }
      return rows;
    } finally {
      if (targetConnection) {
        if (targetConnection.end) {
          await targetConnection.end();
        } else if (targetConnection.destroy) {
          targetConnection.destroy();
        }
      }
    }
  }
}

module.exports = new QueryService();
