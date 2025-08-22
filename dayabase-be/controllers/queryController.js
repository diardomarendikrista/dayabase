const { decrypt } = require("../utils/crypto"); // Impor fungsi dekripsi
const { connectToDatabase } = require("../config/databaseConnector");
const appDbPool = require("../config/db"); // Koneksi ke 'dayabase_app'

class QueryController {
  static async runQuery(req, res) {
    const { sql, connectionId } = req.body;

    if (!sql || !connectionId) {
      return res
        .status(400)
        .json({ message: "sql and connectionId are required!" });
    }

    let targetConnection; // Koneksi ke database target
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

      const decryptedPassword = decrypt(connDetails.password_encrypted);

      const dbConfig = {
        dbType: connDetails.db_type,
        host: connDetails.host,
        port: connDetails.port,
        user: connDetails.db_user,
        database: connDetails.database_name,
        password: decryptedPassword,
      };

      targetConnection = await connectToDatabase(dbConfig);
      let rows;

      switch (dbConfig.dbType) {
        case "postgres":
          const pgResult = await targetConnection.query(sql);
          rows = pgResult.rows;
          break;
        case "mysql":
          const [mysqlRows] = await targetConnection.execute(sql);
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
      // Tutup koneksi ke database target
      if (targetConnection && targetConnection.end) {
        await targetConnection.end();
      } else if (targetConnection && targetConnection.close) {
        await targetConnection.close();
      }
    }
  }

  // ini nanti dihapus, pake yang atas (Ini untuk test menu MVP aja)
  static async testRunQuery(req, res) {
    const { sql, dbConfig } = req.body;

    if (!sql || !dbConfig) {
      return res
        .status(400)
        .json({ message: "sql and dbConfig are required!" });
    }

    let targetConnection; // Koneksi ke database target
    try {
      targetConnection = await connectToDatabase(dbConfig);
      let rows;

      switch (dbConfig.dbType) {
        case "postgres":
          const pgResult = await targetConnection.query(sql);
          rows = pgResult.rows;
          break;
        case "mysql":
          const [mysqlRows] = await targetConnection.execute(sql);
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
      // Menutup koneksi ke database target
      if (targetConnection && targetConnection.end) {
        await targetConnection.end();
      } else if (targetConnection && targetConnection.close) {
        await targetConnection.close();
      }
    }
  }
}

module.exports = QueryController;
