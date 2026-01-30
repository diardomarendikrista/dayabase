const ConnectionService = require("../services/ConnectionService");

class ConnectionController {
  /**
   * @description Membuat koneksi database baru dan menyimpan ke DB
   * @route POST /api/connections
   */
  static async createConnection(req, res) {
    const {
      connection_name,
      db_type,
      host,
      port,
      db_user,
      password,
      database_name,
    } = req.body;

    try {
      const newConnection = await ConnectionService.createConnection({ connection_name, db_type, host, port, db_user, password, database_name });
      res.status(201).json(newConnection);
    } catch (error) {
      if (error.message.includes("required")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error creating connection", error: error.message });
    }
  }

  /**
   * @description Mengambil semua koneksi yang tersimpan (tanpa password)
   * @route GET /api/connections
   */
  static async getAllConnections(req, res) {
    try {
      const connections = await ConnectionService.getAllConnections();
      res.status(200).json(connections);
    } catch (error) {
      res.status(500).json({ message: "Error fetching connections", error: error.message });
    }
  }

  /**
   * @description Mengambil satu koneksi berdasarkan ID (tanpa password)
   * @route GET /api/connections/:id
   */
  static async getConnectionById(req, res) {
    const { id } = req.params;

    try {
      const connection = await ConnectionService.getConnectionById(id);
      if (!connection) {
        return res.status(404).json({ message: "Connection not found." });
      }
      res.status(200).json(connection);
    } catch (error) {
      res.status(500).json({ message: "Error fetching connection", error: error.message });
    }
  }

  /**
   * @description Menghapus sebuah koneksi database
   * @route DELETE /api/connections/:id
   */
  static async deleteConnection(req, res) {
    const { id } = req.params;
    try {
      const success = await ConnectionService.deleteConnection(id);
      if (!success) {
        return res.status(404).json({ message: "Connection not found, nothing to delete." });
      }
      res.status(200).json({ message: `Connection with id ${id} deleted successfully.` });
    } catch (error) {
      if (error.message.includes("still being used")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error deleting connection", error: error.message });
    }
  }

  /**
   * @description Memperbarui sebuah koneksi yang ada
   * @route PUT /api/connections/:id
   */
  static async updateConnection(req, res) {
    const { id } = req.params;
    const {
      connection_name,
      db_type,
      host,
      port,
      db_user,
      password,
      database_name,
    } = req.body;

    try {
      const updated = await ConnectionService.updateConnection(id, { connection_name, db_type, host, port, db_user, password, database_name });
      if (!updated) {
        return res.status(404).json({ message: "Connection not found, nothing to update." });
      }
      res.status(200).json(updated);
    } catch (error) {
      if (error.message.includes("required")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error updating connection", error: error.message });
    }
  }
}

module.exports = ConnectionController;
