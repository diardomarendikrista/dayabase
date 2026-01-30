const pool = require("../config/db");
const { encrypt } = require("../utils/crypto");

class ConnectionService {
  /**
   * Create Connection
   */
  async createConnection({ connection_name, db_type, host, port, db_user, password, database_name }) {
    if (
      !connection_name ||
      !db_type ||
      !host ||
      !port ||
      !db_user ||
      !password ||
      !database_name
    ) {
      throw new Error("All connection fields are required.");
    }

    const password_encrypted = encrypt(password);

    const newConnection = await pool.query(
      `INSERT INTO database_connections 
           (connection_name, db_type, host, port, db_user, password_encrypted, database_name) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, connection_name, db_type, host, port, db_user, database_name`,
      [
        connection_name,
        db_type,
        host,
        port,
        db_user,
        password_encrypted,
        database_name,
      ]
    );
    return newConnection.rows[0];
  }

  /**
   * Get All Connections
   */
  async getAllConnections() {
    const allConnections = await pool.query(
      "SELECT id, connection_name, db_type, host, port, db_user, database_name, created_at FROM database_connections ORDER BY created_at DESC"
    );
    return allConnections.rows;
  }

  /**
   * Get Connection By ID
   */
  async getConnectionById(id) {
    const connection = await pool.query(
      "SELECT id, connection_name, db_type, host, port, db_user, database_name, created_at FROM database_connections WHERE id = $1",
      [id]
    );
    if (connection.rows.length === 0) return null;
    return connection.rows[0];
  }

  /**
   * Delete Connection
   */
  async deleteConnection(id) {
    try {
      const deleteOp = await pool.query(
        "DELETE FROM database_connections WHERE id = $1 RETURNING *",
        [id]
      );
      return deleteOp.rowCount > 0;
    } catch (error) {
      if (error.code === "23503") {
        throw new Error("Cannot delete this connection because it is still being used by one or more questions.");
      }
      throw error;
    }
  }

  /**
   * Update Connection
   */
  async updateConnection(id, { connection_name, db_type, host, port, db_user, password, database_name }) {
    if (
      !connection_name ||
      !db_type ||
      !host ||
      !port ||
      !db_user ||
      !database_name
    ) {
      throw new Error("All fields except password are required.");
    }

    let query;
    let values;

    if (password) {
      const password_encrypted = encrypt(password);
      query = `
            UPDATE database_connections 
            SET connection_name = $1, db_type = $2, host = $3, port = $4, db_user = $5, password_encrypted = $6, database_name = $7
            WHERE id = $8 RETURNING id, connection_name, db_type, host, port, db_user, database_name`;
      values = [
        connection_name,
        db_type,
        host,
        port,
        db_user,
        password_encrypted,
        database_name,
        id,
      ];
    } else {
      query = `
            UPDATE database_connections 
            SET connection_name = $1, db_type = $2, host = $3, port = $4, db_user = $5, database_name = $6
            WHERE id = $7 RETURNING id, connection_name, db_type, host, port, db_user, database_name`;
      values = [
        connection_name,
        db_type,
        host,
        port,
        db_user,
        database_name,
        id,
      ];
    }

    const updatedConnection = await pool.query(query, values);
    if (updatedConnection.rows.length === 0) return null;
    return updatedConnection.rows[0];
  }
}

module.exports = new ConnectionService();
