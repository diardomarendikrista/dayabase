const QueryService = require("../services/QueryService");
const logger = require("../utils/logger");

class QueryController {
  static async runQuery(req, res) {
    const { sql, connectionId, row_limit, parameters } = req.body;

    try {
      const rows = await QueryService.runQuery({ sql, connectionId, row_limit, parameters });
      res.status(200).json(rows);
    } catch (error) {
      // Map specific error messages to status codes
      if (error.message.includes("required!")) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes("SQL too long") || error.message.includes("Multiple statements") || error.message.includes("Only SELECT")) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes("Connection configuration not found")) {
        return res.status(404).json({ message: error.message });
      }

      // Log generic 500s
      logger.error("Query execution error:", error);
      res.status(500).json({ message: error.message || "Query execution failed." });
    }
  }
}

module.exports = QueryController;
