const pool = require("../config/db");
const { decrypt } = require("../utils/crypto");
const { connectToDatabase } = require("../config/databaseConnector");
const { parseSqlWithParameters } = require("../utils/sqlParser");
const logger = require("../utils/logger");

class PublicDashboardService {
  /**
   * Get dashboard by public token
   */
  async getDashboardByToken(token) {
    const dashboardQuery = `
      SELECT id, name, description, public_sharing_enabled, public_token
      FROM dashboards
      WHERE public_token = $1
    `;
    const result = await pool.query(dashboardQuery, [token]);

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  /**
   * Get filters for a dashboard
   */
  async getDashboardFilters(dashboardId) {
    const filtersQuery = `
      SELECT id, name, display_name, type, options, operator
      FROM dashboard_filters
      WHERE dashboard_id = $1
      ORDER BY id ASC
    `;
    const result = await pool.query(filtersQuery, [dashboardId]);
    return result.rows;
  }

  /**
   * Get questions for a dashboard
   */
  async getDashboardQuestions(dashboardId) {
    const questionsQuery = `
      SELECT
        dq.id as instance_id,
        dq.question_id,
        dq.layout_config,
        dq.filter_mappings,
        q.name as question_name,
        q.chart_type,
        qcb.enabled as click_enabled,
        qcb.action as click_action,
        qcb.target_id as click_target_id,
        qcb.target_url as click_target_url,
        d_target.public_sharing_enabled as click_target_public_enabled,
        d_target.public_token as click_target_token,
        qcb.parameter_mappings as click_parameter_mappings
      FROM dashboard_questions dq
      JOIN questions q ON dq.question_id = q.id
      LEFT JOIN question_click_behaviors qcb ON q.id = qcb.question_id
      LEFT JOIN dashboards d_target ON qcb.target_id = d_target.id
      WHERE dq.dashboard_id = $1
    `;
    const result = await pool.query(questionsQuery, [dashboardId]);

    return result.rows.map((row) => {
      // Compatibility logic for old click behavior
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

      return {
        instance_id: row.instance_id,
        id: row.question_id,
        name: row.question_name,
        chart_type: row.chart_type,
        layout: row.layout_config,
        filter_mappings: row.filter_mappings || {},
        click_behavior: row.click_enabled
          ? {
            enabled: row.click_enabled,
            action: row.click_action,
            target_id: row.click_target_id,
            target_url: row.click_target_url,
            parameter_mappings: mappings || [],
            target_token: row.click_target_public_enabled
              ? row.click_target_token
              : null,
          }
          : null,
      };
    });
  }

  /**
   * Check if question is accessible from dashboard (Drill-down check)
   */
  async isQuestionAccessible(dashboardId, questionId) {
    // Check if question is directly in dashboard
    const directCheck = await pool.query(
      `SELECT dq.question_id
       FROM dashboard_questions dq
       WHERE dq.dashboard_id = $1 AND dq.question_id = $2`,
      [dashboardId, questionId]
    );

    if (directCheck.rows.length > 0) {
      return true;
    }

    // Check if question is a drill-down target
    const drillDownCheck = await pool.query(
      `SELECT qcb.target_id
       FROM dashboard_questions dq
       JOIN question_click_behaviors qcb ON dq.question_id = qcb.question_id
       WHERE dq.dashboard_id = $1
         AND qcb.enabled = TRUE
         AND qcb.action = 'link_to_question'
         AND qcb.target_id = $2`,
      [dashboardId, questionId]
    );

    return drillDownCheck.rows.length > 0;
  }

  /**
   * Get public question details
   */
  async getQuestionDetails(questionId) {
    const queryText = `
      SELECT 
        q.id, 
        q.name, 
        q.sql_query, 
        q.chart_type, 
        q.chart_config, 
        q.connection_id,
        
        qcb.enabled as click_enabled,
        qcb.action as click_action,
        qcb.target_id as click_target_id,
        qcb.target_url as click_target_url,
        qcb.parameter_mappings as click_parameter_mappings,
        
        d_target.public_token as click_target_token,
        d_target.public_sharing_enabled as click_target_public_enabled

      FROM questions q
      LEFT JOIN question_click_behaviors qcb ON q.id = qcb.question_id
      LEFT JOIN dashboards d_target ON qcb.target_id = d_target.id
      WHERE q.id = $1
    `;

    const result = await pool.query(queryText, [questionId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    let mappings = row.click_parameter_mappings;

    return {
      id: row.id,
      name: row.name,
      sql_query: row.sql_query,
      chart_type: row.chart_type,
      chart_config: row.chart_config,
      connection_id: row.connection_id,
      click_behavior: row.click_enabled
        ? {
          enabled: row.click_enabled,
          action: row.click_action,
          target_id: row.click_target_id,
          target_url: row.click_target_url,
          parameter_mappings: mappings || [],
          target_token: row.click_target_public_enabled
            ? row.click_target_token
            : null,
        }
        : null,
    };
  }

  /**
   * Execute Query for Public Question
   */
  async executeQuestionQuery(questionId, parameters = {}) {
    // 1. Get query config
    const questionQuery = `
        SELECT q.sql_query, q.connection_id,
              c.db_type, c.host, c.port, c.db_user,
              c.database_name, c.password_encrypted
        FROM questions q
        JOIN database_connections c ON q.connection_id = c.id
        WHERE q.id = $1
      `;
    const questionResult = await pool.query(questionQuery, [questionId]);

    if (questionResult.rows.length === 0) {
      throw new Error('Question not found');
    }

    const question = questionResult.rows[0];
    const sql = question.sql_query;
    const dbType = question.db_type;

    // 2. Security Checks
    const cleaned = sql.trim();
    if (cleaned.length > 50000) throw new Error("SQL too long.");
    if (cleaned.includes(";")) throw new Error("Multiple statements not allowed.");

    const sqlWithoutComments = cleaned
      .replace(/^\s*(\/\*[\s\S]*?\*\/|--.*(\r?\n|$))*/g, "")
      .trim();

    if (!/^(SELECT|WITH)\b/i.test(sqlWithoutComments)) {
      throw new Error("Only SELECT queries allowed.");
    }

    // 3. Parse parameters
    const { finalSql, queryValues } = parseSqlWithParameters(
      sql,
      parameters,
      dbType
    );

    // 4. Limit enforcement
    const limit = 1000;
    let execSql = finalSql;
    if (!/limit\s+\d+/i.test(sqlWithoutComments)) {
      execSql = `${finalSql.trim()} LIMIT ${limit} `;
    }

    // 5. Execution
    const decryptedPassword = decrypt(question.password_encrypted);
    const dbConfig = {
      dbType: question.db_type,
      host: question.host,
      port: question.port,
      user: question.db_user,
      database: question.database_name,
      password: decryptedPassword,
    };

    let targetConnection = null;
    try {
      targetConnection = await connectToDatabase(dbConfig);
      let rows;
      if (dbConfig.dbType === 'postgres') {
        const pgResult = await targetConnection.query(execSql, queryValues);
        rows = pgResult.rows;
      } else if (dbConfig.dbType === 'mysql') {
        const [mysqlRows] = await targetConnection.execute(execSql, queryValues);
        rows = mysqlRows;
      } else {
        throw new Error("Unsupported database type.");
      }
      return rows;
    } finally {
      if (targetConnection) {
        if (targetConnection.end) await targetConnection.end();
        else if (targetConnection.destroy) targetConnection.destroy();
      }
    }
  }
}

module.exports = new PublicDashboardService();
