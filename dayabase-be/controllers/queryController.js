const { decrypt } = require("../utils/crypto"); // Impor fungsi dekripsi
const { connectToDatabase } = require("../config/databaseConnector");
const appDbPool = require("../config/db"); // Koneksi ke 'dayabase_app'
const { parseSqlWithParameters } = require("../utils/sqlParser");

class QueryController {
  static async runQuery(req, res) {
    const { sql, connectionId, row_limit, parameters } = req.body;

    if (!sql || !connectionId) {
      return res
        .status(400)
        .json({ message: "sql and connectionId are required!" });
    }

    // ---- BASIC SECURITY CHECKS (prevent SQL injection) ----
    // Karena menyangkut hajat hidup perusahaan, tolong nanti ini dikembangkan bener2, kalo DB kena inject, kita kena kartu merah. hehe
    const cleaned = sql.trim();
    if (cleaned.length > 50000)
      return res.status(400).json({ message: "SQL too long." });

    // simple semicolon check (boleh dikembangkan nanti)
    if (cleaned.includes(";"))
      return res
        .status(400)
        .json({ message: "Multiple statements not allowed." });

    // simple check start query
    const sqlWithoutComments = cleaned
      .replace(/^\s*(\/\*[\s\S]*?\*\/|--.*(\r?\n|$))*/g, "")
      .trim();
    if (!/^(SELECT|WITH)\b/i.test(sqlWithoutComments)) {
      return res.status(400).json({ message: "Only SELECT queries allowed." });
    }

    // enforce LIMIT
    const limit =
      Number.isInteger(row_limit) && row_limit > 0 ? row_limit : 1000;
    let execSql = sql;
    if (!/limit\s+\d+/i.test(sqlWithoutComments))
      execSql = `${sql.trim()} LIMIT ${limit}`;

    // ----------------- fetch connection details -----------------
    let targetConnection; // Definisikan di scope luar agar bisa diakses di 'finally'
    try {
      //  Ambil detail koneksi dari DB Aplikasi
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

      // Parse SQL menggunakan parameters
      // Ini akan melempar error jika parameter yang diperlukan hilang
      const { finalSql, queryValues } = parseSqlWithParameters(
        sql,
        parameters,
        dbType
      );

      // Enforce LIMIT (pada SQL yang sudah diproses)
      const limit =
        Number.isInteger(row_limit) && row_limit > 0 ? row_limit : 1000;
      let execSql = finalSql;

      // Cek LIMIT lagi pada SQL *mentah* (karena 'finalSql' sudah diganti $1, $2)
      if (!/limit\s+\d+/i.test(sqlWithoutComments)) {
        execSql = `${finalSql.trim()} LIMIT ${limit}`;
      }

      // Dekripsi password dan siapkan config
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
          // Kirim SQL yang diproses DAN array 'queryValues'
          const pgResult = await targetConnection.query(execSql, queryValues);
          rows = pgResult.rows;
          break;
        case "mysql":
          // Kirim SQL yang diproses DAN array 'queryValues'
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
      // 6. Tutup koneksi ke database target
      if (targetConnection && targetConnection.end) {
        await targetConnection.end(); // Untuk node-postgres
      } else if (targetConnection && targetConnection.close) {
        await targetConnection.close(); // Untuk mysql2
      }
    }
  }
}

module.exports = QueryController;
