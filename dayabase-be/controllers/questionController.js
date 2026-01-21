// controllers/questionController.js
const pool = require("../config/db");
const QuestionService = require("../services/QuestionService");
const logger = require("../utils/logger");

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
  }

  /**
   * @description Mengambil semua pertanyaan (hanya info dasar)
   * @route GET /api/questions
   */
  static async getAllQuestions(req, res) {
    const { collectionId } = req.query;

    let queryText = "SELECT id, name, chart_type, created_at FROM questions";
    const queryParams = [];

    if (collectionId) {
      queryText += " WHERE collection_id = $1 OR collection_id IS NULL";
      queryParams.push(collectionId);
    }

    queryText += " ORDER BY name ASC";

    const allQuestions = await pool.query(queryText, queryParams);
    res.status(200).json(allQuestions.rows);
  }

  /**
   * @description Get question with click behavior (for dashboard/public view)
   * @route GET /api/questions/:id (modify existing method)
   */
  static async getQuestionById(req, res) {
    const { id } = req.params;

    // Panggil Service (Query Pusat)
    const row = await QuestionService.getQuestionDetail(id);

    if (!row) {
      return res.status(404).json({ message: "Question not found" });
    }

    // 1. Compatibility Logic untuk parameter mappings
    let mappings = row.click_parameter_mappings;
    if (
      (!mappings || mappings.length === 0) &&
      row.click_pass_column &&
      row.click_target_param
    ) {
      mappings = [
        {
          passColumn: row.click_pass_column,
          targetParam: row.click_target_param,
        },
      ];
    }

    // 2. Susun Object Response
    const response = {
      id: row.id,
      name: row.name,
      sql_query: row.sql_query,
      chart_type: row.chart_type,
      chart_config: row.chart_config,
      updated_at: row.updated_at,

      // Info Connection
      connection_id: row.connection_id,
      connection_name: row.connection_name,
      db_type: row.db_type,
      host: row.host,
      port: row.port,
      db_user: row.db_user,
      database_name: row.database_name,
      // password_encrypted TIDAK DIKIRIM ke frontend admin

      // Info Collection
      collection_id: row.collection_id,
      collection_name: row.collection_name,

      // Info Click Behavior
      click_behavior: row.click_enabled
        ? {
          enabled: row.click_enabled,
          action: row.click_action,
          target_id: row.click_target_id,
          target_url: row.click_target_url,
          parameter_mappings: mappings || [],

          // Kirim token target jika dashboard tujuan PUBLIC
          target_token: row.click_target_public_enabled
            ? row.click_target_token
            : null,
        }
        : null,
    };

    res.status(200).json(response);
  }

  /**
   * @description Hapus
   * @route DELETE /api/questions/:id
   */
  static async deleteQuestion(req, res) {
    const { id } = req.params;

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
  }

  /**
   * @description Update or create click behavior configuration
   * @route PUT /api/questions/:id/click-behavior
   */
  static async updateClickBehavior(req, res) {
    const { id: question_id } = req.params;
    const { enabled, action, target_id, target_url, parameter_mappings } =
      req.body;
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

    // Validasi parameter_mappings harus array jika enabled
    if (enabled && action !== "external_url") {
      if (!parameter_mappings || !Array.isArray(parameter_mappings)) {
        return res
          .status(400)
          .json({ message: "Parameter mappings must be an array." });
      }
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
      const mappingsJson = JSON.stringify(parameter_mappings || []);

      if (existingBehavior.rowCount > 0) {
        // UPDATE existing
        result = await client.query(
          `UPDATE question_click_behaviors 
           SET enabled = $1, action = $2, target_id = $3, target_url = $4, parameter_mappings = $5
           WHERE question_id = $6 
           RETURNING *`,
          [
            enabled,
            enabled ? action : null,
            enabled ? target_id : null,
            enabled ? target_url : null,
            mappingsJson,
            question_id,
          ]
        );
      } else {
        // INSERT new
        result = await client.query(
          `INSERT INTO question_click_behaviors 
           (question_id, enabled, action, target_id, target_url, parameter_mappings)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            question_id,
            enabled,
            enabled ? action : null,
            enabled ? target_id : null,
            enabled ? target_url : null,
            mappingsJson,
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
      // Re-throw so the global error handler gets it
      throw error;
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

    // Ambil kolom parameter_mappings juga
    const result = await pool.query(
      `SELECT qcb.* FROM question_click_behaviors qcb
         WHERE qcb.question_id = $1`,
      [question_id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        question_id: parseInt(question_id),
        enabled: false,
        action: null,
        target_id: null,
        target_url: null,
        parameter_mappings: [],
      });
    }

    const row = result.rows[0];
    let mappings = row.parameter_mappings;

    // Fallback compatibility logic
    if (
      (!mappings || mappings.length === 0) &&
      row.pass_column &&
      row.target_param
    ) {
      mappings = [
        { passColumn: row.pass_column, targetParam: row.target_param },
      ];
    }

    res.status(200).json({
      ...row,
      parameter_mappings: mappings || [],
    });
  }

  /**
   * @description Delete click behavior
   * @route DELETE /api/questions/:id/click-behavior
   */
  static async deleteClickBehavior(req, res) {
    const { id: question_id } = req.params;

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
  }
}

module.exports = QuestionController;
