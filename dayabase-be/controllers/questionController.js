// controllers/questionController.js
const pool = require("../config/db");

class QuestionController {
  /**
   * @description Menyimpan pertanyaan baru ke database
   * @route POST /api/questions
   */
  static async createQuestion(req, res) {
    const {
      name,
      sql_query,
      chart_type,
      chart_config,
      connection_id,
      collection_id,
    } = req.body;
    const userId = req.user.id;

    // Validasi input
    if (!name || !sql_query || !chart_type || !chart_config || !connection_id) {
      return res.status(400).json({
        message:
          "All fields are required: name, sql_query, chart_type, chart_config, connection_id",
      });
    }

    try {
      const newQuestion = await pool.query(
        "INSERT INTO questions (name, sql_query, chart_type, chart_config, connection_id, collection_id, updated_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [
          name,
          sql_query,
          chart_type,
          JSON.stringify(chart_config),
          connection_id,
          collection_id || null,
          userId,
        ]
      );

      res.status(201).json(newQuestion.rows[0]);
    } catch (error) {
      console.error("Error creating question:", error);
      res
        .status(500)
        .json({ message: "Failed to create question", error: error.message });
    }
  }

  /**
   * @description Mengambil semua pertanyaan (hanya info dasar)
   * @route GET /api/questions
   */
  static async getAllQuestions(req, res) {
    const { collectionId } = req.query;
    try {
      let queryText = "SELECT id, name, chart_type, created_at FROM questions";
      const queryParams = [];

      if (collectionId) {
        queryText += " WHERE collection_id = $1 OR collection_id IS NULL";
        queryParams.push(collectionId);
      }

      queryText += " ORDER BY name ASC";

      const allQuestions = await pool.query(queryText, queryParams);
      res.status(200).json(allQuestions.rows);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch questions", error: error.message });
    }
  }

  /**
   * @description Get question with click behavior (for dashboard/public view)
   * @route GET /api/questions/:id (modify existing method)
   */
  static async getQuestionById(req, res) {
    const { id } = req.params;
    try {
      const queryText = `
        SELECT 
          q.id, q.name, q.sql_query, q.chart_type, q.chart_config, q.updated_at,
          c.id as connection_id, c.connection_name, c.db_type, c.host, c.port, c.db_user, c.database_name,
          col.id as collection_id, col.name as collection_name,
          qcb.enabled as click_enabled,
          qcb.action as click_action,
          qcb.target_id as click_target_id,
          qcb.target_url as click_target_url,
          qcb.pass_column as click_pass_column,
          qcb.target_param as click_target_param
        FROM questions q
        JOIN database_connections c ON q.connection_id = c.id
        LEFT JOIN collections col ON q.collection_id = col.id
        LEFT JOIN question_click_behaviors qcb ON q.id = qcb.question_id
        WHERE q.id = $1;
      `;
      const questionResult = await pool.query(queryText, [id]);

      if (questionResult.rows.length === 0) {
        return res.status(404).json({ message: "Question not found" });
      }

      const row = questionResult.rows[0];

      // Structure the response with click_behavior as nested object
      const response = {
        id: row.id,
        name: row.name,
        sql_query: row.sql_query,
        chart_type: row.chart_type,
        chart_config: row.chart_config,
        updated_at: row.updated_at,
        connection_id: row.connection_id,
        connection_name: row.connection_name,
        db_type: row.db_type,
        host: row.host,
        port: row.port,
        db_user: row.db_user,
        database_name: row.database_name,
        collection_id: row.collection_id,
        collection_name: row.collection_name,
        click_behavior: row.click_enabled
          ? {
              enabled: row.click_enabled,
              action: row.click_action,
              target_id: row.click_target_id,
              target_url: row.click_target_url,
              pass_column: row.click_pass_column,
              target_param: row.click_target_param,
            }
          : null,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error(`Error fetching question ${id}:`, error);
      res.status(500).json({
        message: "Failed to fetch question",
        error: error.message,
      });
    }
  }

  /**
   * @description Hapus
   * @route DELETE /api/questions/:id
   */
  static async deleteQuestion(req, res) {
    const { id } = req.params;
    try {
      const deleteOp = await pool.query(
        "DELETE FROM questions WHERE id = $1 RETURNING *",
        [id]
      );

      // Cek apakah ada baris yang dihapus
      if (deleteOp.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Question not found, nothing to delete." });
      }

      res
        .status(200)
        .json({ message: `Question with id ${id} deleted successfully.` });
    } catch (error) {
      console.error(`Error deleting question ${id}:`, error);
      res
        .status(500)
        .json({ message: "Failed to delete question", error: error.message });
    }
  }

  /**
   * @description Memperbarui sebuah pertanyaan yang ada
   * @route PUT /api/questions/:id
   */
  static async updateQuestion(req, res) {
    const { id } = req.params;
    const { name, sql_query, chart_type, chart_config, connection_id } =
      req.body;
    const userId = req.user.id;

    // Validasi input
    if (!name || !sql_query || !chart_type || !chart_config || !connection_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const updatedQuestion = await pool.query(
        `UPDATE questions 
         SET 
           name = $1, 
           sql_query = $2, 
           chart_type = $3, 
           chart_config = $4, 
           connection_id = $5,
           updated_by_user_id = $6
         WHERE id = $7 
         RETURNING *`,
        [
          name,
          sql_query,
          chart_type,
          JSON.stringify(chart_config),
          connection_id,
          userId,
          id,
        ]
      );

      if (updatedQuestion.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Question not found, nothing to update." });
      }

      res.status(200).json(updatedQuestion.rows[0]);
    } catch (error) {
      console.error(`Error updating question ${id}:`, error);
      res
        .status(500)
        .json({ message: "Failed to update question", error: error.message });
    }
  }

  /**
   * @description Update or create click behavior configuration
   * @route PUT /api/questions/:id/click-behavior
   */
  static async updateClickBehavior(req, res) {
    const { id: question_id } = req.params;
    const {
      enabled,
      action,
      target_id,
      target_url,
      pass_column,
      target_param,
    } = req.body;
    const userId = req.user.id;

    // Validation
    if (enabled && !action) {
      return res.status(400).json({
        message: "Action is required when click behavior is enabled.",
      });
    }

    if (enabled && action !== "external_url" && !target_id) {
      return res.status(400).json({
        message: "Target ID is required for this action type.",
      });
    }

    if (enabled && action === "external_url" && !target_url) {
      return res.status(400).json({
        message: "Target URL is required for external URL action.",
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify question exists
      const questionCheck = await client.query(
        "SELECT id FROM questions WHERE id = $1",
        [question_id]
      );

      if (questionCheck.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Question not found." });
      }

      // Check if click behavior already exists
      const existingBehavior = await client.query(
        "SELECT id FROM question_click_behaviors WHERE question_id = $1",
        [question_id]
      );

      let result;

      if (existingBehavior.rowCount > 0) {
        // UPDATE existing
        result = await client.query(
          `UPDATE question_click_behaviors 
           SET enabled = $1, action = $2, target_id = $3, target_url = $4, 
               pass_column = $5, target_param = $6
           WHERE question_id = $7 
           RETURNING *`,
          [
            enabled,
            enabled ? action : null,
            enabled ? target_id : null,
            enabled ? target_url : null,
            enabled ? pass_column : null,
            enabled ? target_param : null,
            question_id,
          ]
        );
      } else {
        // INSERT new
        result = await client.query(
          `INSERT INTO question_click_behaviors 
           (question_id, enabled, action, target_id, target_url, pass_column, target_param)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            question_id,
            enabled,
            enabled ? action : null,
            enabled ? target_id : null,
            enabled ? target_url : null,
            enabled ? pass_column : null,
            enabled ? target_param : null,
          ]
        );
      }

      // Update question's updated_at
      await client.query(
        "UPDATE questions SET updated_by_user_id = $1, updated_at = NOW() WHERE id = $2",
        [userId, question_id]
      );

      await client.query("COMMIT");

      res.status(200).json(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(
        `Failed to update click behavior for question ${question_id}:`,
        error
      );
      res.status(500).json({
        message: "Failed to update click behavior",
        error: error.message,
      });
    } finally {
      client.release();
    }
  }

  /**
   * @description Get click behavior configuration
   * @route GET /api/questions/:id/click-behavior
   */
  static async getClickBehavior(req, res) {
    const { id: question_id } = req.params;

    try {
      const result = await pool.query(
        `SELECT qcb.* 
         FROM question_click_behaviors qcb
         WHERE qcb.question_id = $1`,
        [question_id]
      );

      if (result.rows.length === 0) {
        // Return default empty config if no behavior configured
        return res.status(200).json({
          question_id: parseInt(question_id),
          enabled: false,
          action: null,
          target_id: null,
          target_url: null,
          pass_column: null,
          target_param: null,
        });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error(
        `Failed to get click behavior for question ${question_id}:`,
        error
      );
      res.status(500).json({
        message: "Failed to get click behavior",
        error: error.message,
      });
    }
  }

  /**
   * @description Delete click behavior
   * @route DELETE /api/questions/:id/click-behavior
   */
  static async deleteClickBehavior(req, res) {
    const { id: question_id } = req.params;

    try {
      const result = await pool.query(
        "DELETE FROM question_click_behaviors WHERE question_id = $1 RETURNING *",
        [question_id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "No click behavior found for this question.",
        });
      }

      res.status(200).json({
        message: "Click behavior deleted successfully.",
      });
    } catch (error) {
      console.error(
        `Failed to delete click behavior for question ${question_id}:`,
        error
      );
      res.status(500).json({
        message: "Failed to delete click behavior",
        error: error.message,
      });
    }
  }

  /**
   * @description Validate target (question/dashboard) exists
   * @route POST /api/questions/validate-target
   */
  static async validateTarget(req, res) {
    const { action, target_id } = req.body;

    if (!action || !target_id) {
      return res.status(400).json({
        message: "Action and target_id are required.",
      });
    }

    try {
      let tableName;
      let itemType;

      if (action === "link_to_question") {
        tableName = "questions";
        itemType = "question";
      } else if (action === "link_to_dashboard") {
        tableName = "dashboards";
        itemType = "dashboard";
      } else if (action === "external_url") {
        // External URL doesn't need validation
        return res.status(200).json({
          valid: true,
          message: "External URL action doesn't require target validation.",
        });
      } else {
        return res.status(400).json({
          message: "Invalid action type.",
        });
      }

      const result = await pool.query(
        `SELECT id, name FROM ${tableName} WHERE id = $1`,
        [target_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: `Target ${itemType} not found.`,
          valid: false,
        });
      }

      res.status(200).json({
        valid: true,
        target: result.rows[0],
      });
    } catch (error) {
      console.error("Failed to validate target:", error);
      res.status(500).json({
        message: "Failed to validate target",
        error: error.message,
      });
    }
  }
}

module.exports = QuestionController;
