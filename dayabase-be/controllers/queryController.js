// controllers/queryController.js
const { decrypt } = require("../utils/crypto");
const { connectToDatabase } = require("../config/databaseConnector");
const appDbPool = require("../config/db");
const { parseSqlWithParameters } = require("../utils/sqlParser");

class QueryController {
  static async runQuery(req, res) {
    const { sql, connectionId, row_limit, parameters } = req.body;

    if (!sql || !connectionId) {
      return res
        .status(400)
        .json({ message: "sql and connectionId are required!" });
    }

    // ---- BASIC SECURITY CHECKS ----
    const cleaned = sql.trim();
    if (cleaned.length > 50000)
      return res.status(400).json({ message: "SQL too long." });

    if (cleaned.includes(";"))
      return res
        .status(400)
        .json({ message: "Multiple statements not allowed." });

    const sqlWithoutComments = cleaned
      .replace(/^\s*(\/\*[\s\S]*?\*\/|--.*(\r?\n|$))*/g, "")
      .trim();

    if (!/^(SELECT|WITH)\b/i.test(sqlWithoutComments)) {
      return res.status(400).json({ message: "Only SELECT queries allowed." });
    }

    let targetConnection;
    try {
      const connDetailsResult = await appDbPool.query(
        "SELECT * FROM database_connections WHERE id = $1",
        [connectionId]
      );

      if (connDetailsResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Connection configuration not found." });
      }

      const connDetails = connDetailsResult.rows[0];
      const dbType = connDetails.db_type;

      // Parse SQL dengan parameters (placeholder substitution)
      const { finalSql, queryValues } = parseSqlWithParameters(
        sql,
        parameters || {},
        dbType
      );

      // Enforce LIMIT pada SQL yang sudah diproses
      const limit =
        Number.isInteger(row_limit) && row_limit > 0 ? row_limit : 1000;

      let execSql = finalSql;
      // Cek apakah sudah ada LIMIT di SQL original
      if (!/limit\s+\d+/i.test(sqlWithoutComments)) {
        execSql = `${finalSql.trim()} LIMIT ${limit}`;
      }

      // Decrypt password dan setup koneksi
      const decryptedPassword = decrypt(connDetails.password_encrypted);
      const dbConfig = {
        dbType: connDetails.db_type,
        host: connDetails.host,
        port: connDetails.port,
        user: connDetails.db_user,
        database: connDetails.database_name,
        password: decryptedPassword,
      };

      // Koneksi dan eksekusi query
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

      res.status(200).json(rows);
    } catch (error) {
      console.error("Error executing query:", error);
      res
        .status(500)
        .json({ message: "Failed to execute query", error: error.message });
    } finally {
      // 6. Tutup koneksi
      if (targetConnection && targetConnection.end) {
        await targetConnection.end();
      } else if (targetConnection && targetConnection.close) {
        await targetConnection.close();
      }
    }
  }
}

module.exports = QueryController;
