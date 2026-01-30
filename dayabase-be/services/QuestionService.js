// services/QuestionService.js
const pool = require("../config/db");

class QuestionService {
  /**
   * Get Question Detail with All Relations
   */
  static async getQuestionDetail(questionId) {
    const queryText = `
        SELECT 
          q.id, 
          q.name, 
          q.sql_query, 
          q.chart_type, 
          q.chart_config, 
          q.updated_at,
          
          -- Connection Details
          c.id as connection_id, 
          c.connection_name, 
          c.db_type, 
          c.host, 
          c.port, 
          c.db_user, 
          c.database_name, 
          c.password_encrypted,
          
          -- Collection Details
          col.id as collection_id, 
          col.name as collection_name,
          
          -- Click Behavior Details
          qcb.enabled as click_enabled,
          qcb.action as click_action,
          qcb.target_id as click_target_id,
          qcb.target_url as click_target_url,
          qcb.parameter_mappings as click_parameter_mappings,

          -- Target Dashboard Details (untuk drilldown ke dashboard lain)
          d_target.public_token as click_target_token,
          d_target.public_sharing_enabled as click_target_public_enabled

        FROM questions q
        JOIN database_connections c ON q.connection_id = c.id
        LEFT JOIN collections col ON q.collection_id = col.id
        LEFT JOIN question_click_behaviors qcb ON q.id = qcb.question_id
        LEFT JOIN dashboards d_target ON qcb.target_id = d_target.id
        WHERE q.id = $1
    `;

    const result = await pool.query(queryText, [questionId]);
    return result.rows[0];
  }

  /**
   * Create Question
   */
  static async createQuestion(userId, { name, sql_query, chart_type, chart_config, connection_id, collection_id }) {
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
    return newQuestion.rows[0];
  }

  /**
   * Get All Questions
   */
  static async getAllQuestions(collectionId) {
    let queryText = "SELECT id, name, chart_type, created_at FROM questions";
    const queryParams = [];

    if (collectionId) {
      queryText += " WHERE collection_id = $1 OR collection_id IS NULL";
      queryParams.push(collectionId);
    }

    queryText += " ORDER BY name ASC";
    const allQuestions = await pool.query(queryText, queryParams);
    return allQuestions.rows;
  }

  /**
   * Update Question
   */
  static async updateQuestion(id, userId, { name, sql_query, chart_type, chart_config, connection_id }) {
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
    return updatedQuestion.rows.length > 0 ? updatedQuestion.rows[0] : null;
  }

  /**
   * Delete Question
   */
  static async deleteQuestion(id) {
    const deleteOp = await pool.query(
      "DELETE FROM questions WHERE id = $1 RETURNING *",
      [id]
    );
    return deleteOp.rowCount > 0;
  }

  /**
   * Update Click Behavior
   */
  static async updateClickBehavior(question_id, userId, { enabled, action, target_id, target_url, parameter_mappings }) {
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
        return null; // Not found
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
            question_id,
          ]
        );
      }

      // Update question's updated_at
      await client.query(
        "UPDATE questions SET updated_by_user_id = $1, updated_at = NOW() WHERE id = $2",
        [userId, question_id]
      );

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async getClickBehavior(question_id) {
    const result = await pool.query(
      `SELECT qcb.* FROM question_click_behaviors qcb
         WHERE qcb.question_id = $1`,
      [question_id]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  static async deleteClickBehavior(question_id) {
    const result = await pool.query(
      "DELETE FROM question_click_behaviors WHERE question_id = $1 RETURNING *",
      [question_id]
    );
    return result.rowCount > 0;
  }

  /**
   * Validate Target Existance
   */
  static async validateTarget(action, target_id) {
    let tableName;

    if (action === "link_to_question") {
      tableName = "questions";
    } else if (action === "link_to_dashboard") {
      tableName = "dashboards";
    } else if (action === "external_url") {
      return { valid: true };
    } else {
      throw new Error("Invalid action type.");
    }

    const result = await pool.query(
      `SELECT id, name FROM ${tableName} WHERE id = $1`,
      [target_id]
    );

    if (result.rows.length === 0) {
      return { valid: false };
    }

    return { valid: true, target: result.rows[0] };
  }
}

module.exports = QuestionService;
