const pool = require("../config/db");
const { decrypt } = require("../utils/crypto");
const { connectToDatabase } = require("../config/databaseConnector"); // Kept at top
const { parseSqlWithParameters } = require("../utils/sqlParser"); // Kept at top
const logger = require("../utils/logger"); // Added logger

class PublicController {
  /**
   * @description Get Public Dashboard Data by Token
   * @route GET /api/public/dashboard/:token
   */
  static async getPublicDashboard(req, res) {
    const { token } = req.params;

    try {
      // 1. Validasi Token & Ambil Info Dashboard
      const dashboardQuery = `
        SELECT id, name, description, public_sharing_enabled, public_token
        FROM dashboards
        WHERE public_token = $1
      `;
      const dashboardRes = await pool.query(dashboardQuery, [token]);

      if (dashboardRes.rows.length === 0) {
        return res.status(404).json({ message: "Dashboard not found." });
      }

      const dashboard = dashboardRes.rows[0];

      if (!dashboard.public_sharing_enabled) {
        return res
          .status(403)
          .json({ message: "This dashboard is not publicly shared." });
      }

      // 2. Ambil Filters (jika ada)
      const filtersQuery = `
        SELECT id, name, display_name, type, options, operator
        FROM dashboard_filters
        WHERE dashboard_id = $1
        ORDER BY id ASC
      `;
      const filtersRes = await pool.query(filtersQuery, [dashboard.id]);

      // 3. Ambil Questions yang ada di dashboard ini
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
      const questionsRes = await pool.query(questionsQuery, [dashboard.id]);

      const questions = questionsRes.rows.map((row) => {
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

      res.status(200).json({
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        filters: filtersRes.rows,
        questions,
      });
    } catch (error) {
      logger.error(
        `[PUBLIC_CONTROLLER_ERROR] Gagal mengambil dashboard publik dengan token ${token}: `,
        error
      );
      res.status(500).json({
        message: "Gagal mengambil data dashboard publik.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * Helper DrillDown: Check if question is accessible from dashboard
   */
  static async isQuestionAccessible(dashboardId, questionId) {
    // Check if question is directly in dashboard
    const directCheck = await pool.query(
      `SELECT dq.question_id
       FROM dashboard_questions dq
       WHERE dq.dashboard_id = $1 AND dq.question_id = $2`,
      [dashboardId, questionId]
    );

    if (directCheck.rows.length > 0) {
      return true; // Question is in dashboard
    }

    // Check if question is a drill-down target from any question in dashboard
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

    return drillDownCheck.rows.length > 0; // Question is a drill-down target
  }

  /**
   * @description Get question details for public dashboard
   * @route GET /api/public/dashboards/:token/questions/:questionId
   */
  static async getPublicQuestion(req, res) {
    const { token, questionId } = req.params;

    try {
      // Verify dashboard is public and token is valid
      const dashboardCheck = await pool.query(
        `SELECT d.id, d.name 
         FROM dashboards d
         WHERE d.public_token = $1 AND d.public_sharing_enabled = TRUE`,
        [token]
      );

      if (dashboardCheck.rows.length === 0) {
        return res.status(404).json({
          message: "Dashboard not found or sharing is disabled.",
        });
      }

      const dashboardId = dashboardCheck.rows[0].id;

      // Cek Akses (Logic unik Public - Drilldown check)
      const isAccessible = await PublicController.isQuestionAccessible(
        dashboardId,
        questionId
      );

      if (!isAccessible) {
        return res.status(403).json({
          message: "Question is not accessible from this dashboard.",
        });
      }

      // Query Question Detail with Click Behavior
      // NOTE: User's original code queried questions table for click_*, but schema has it in question_click_behaviors
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

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Question not found." });
      }

      const row = result.rows[0];

      // -- FORMATTING & SANITIZING RESPONSE --
      // Compatibility Logic
      let mappings = row.click_parameter_mappings;
      // Note: Removed fallback to q.click_pass_column since those cols don't exist

      // Susun Response
      const response = {
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

      res.status(200).json(response);
    } catch (error) {
      console.error(`Error fetching public question ${questionId}:`, error);
      res.status(500).json({
        message: "Failed to fetch question.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * @description Run query for public dashboard question (with parameters supported)
   * @route POST /api/public/dashboards/:token/questions/:questionId/run
   */
  static async runPublicQuery(req, res) {
    const { token, questionId } = req.params;
    const { parameters = {} } = req.body;

    let targetConnection;

    try {
      // Verify dashboard is public
      const dashboardCheck = await pool.query(
        `SELECT d.id FROM dashboards d
         WHERE d.public_token = $1 AND d.public_sharing_enabled = TRUE`,
        [token]
      );

      if (dashboardCheck.rows.length === 0) {
        return res.status(404).json({
          message: "Dashboard not found or sharing is disabled.",
        });
      }

      const dashboardId = dashboardCheck.rows[0].id;

      const isAccessible = await PublicController.isQuestionAccessible(
        dashboardId,
        questionId
      );

      if (!isAccessible) {
        return res.status(403).json({
          message: "Question is not accessible from this dashboard.",
        });
      }

      // 3. Get question and connection details
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
        return res.status(404).json({ message: "Question not found." });
      }

      const question = questionResult.rows[0];
      const sql = question.sql_query;
      const dbType = question.db_type;

      // 4. Basic SQL security checks
      const cleaned = sql.trim();
      if (cleaned.length > 50000) {
        return res.status(400).json({ message: "SQL too long." });
      }

      if (cleaned.includes(";")) {
        return res
          .status(400)
          .json({ message: "Multiple statements not allowed." });
      }

      const sqlWithoutComments = cleaned
        .replace(/^\s*(\/\*[\s\S]*?\*\/|--.*(\r?\n|$))*/g, "")
        .trim();

      if (!/^(SELECT|WITH)\b/i.test(sqlWithoutComments)) {
        return res
          .status(400)
          .json({ message: "Only SELECT queries allowed." });
      }

      // 5. Parse SQL with parameters
      const { finalSql, queryValues } = parseSqlWithParameters(
        sql,
        parameters,
        dbType
      );

      // 6. Enforce LIMIT
      const limit = 1000;
      let execSql = finalSql;
      if (!/limit\s+\d+/i.test(sqlWithoutComments)) {
        execSql = `${finalSql.trim()} LIMIT ${limit} `;
      }

      // 7. Setup connection and execute
      const decryptedPassword = decrypt(question.password_encrypted);
      const dbConfig = {
        dbType: question.db_type,
        host: question.host,
        port: question.port,
        user: question.db_user,
        database: question.database_name,
        password: decryptedPassword,
      };

      targetConnection = await connectToDatabase(dbConfig);

      let rows;
      switch (dbConfig.dbType) {
        case "postgres":
          const pgResult = await targetConnection.query(execSql, queryValues);
          rows = pgResult.rows;
          break;
        case "mysql":
          const [mysqlRows] = await targetConnection.execute(execSql, queryValues);
          rows = mysqlRows;
          break;
        default:
          return res.status(400).json({ message: "Unsupported database type." });
      }

      res.status(200).json(rows);
    } catch (error) {
      logger.error("Error executing public query:", error);
      res.status(500).json({
        message: "Failed to execute query",
        error: error.message,
      });
    } finally {
      if (targetConnection) {
        // Close connection based on type
        if (targetConnection.end) {
          await targetConnection.end();
        } else if (targetConnection.destroy) { // For MySQL connections
          targetConnection.destroy();
        }
      }
    }
  }
}

module.exports = PublicController;
