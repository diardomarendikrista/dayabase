// services/QuestionService.js
const pool = require("../config/db");

class QuestionService {
  // saat ini dipakai di questionController dan publicController, agar tidak redundant disatukan disini.
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
}

module.exports = QuestionService;
