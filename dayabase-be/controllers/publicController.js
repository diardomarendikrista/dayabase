// controllers/publicController.js
const pool = require("../config/db");
const { decrypt } = require("../utils/crypto");
const { connectToDatabase } = require("../config/databaseConnector");
const { parseSqlWithParameters } = require("../utils/sqlParser");

class PublicController {
  /**
   * @description Mengambil data dashboard publik berdasarkan token
   * @route GET /api/public/dashboards/:token
   */
  static async getPublicDashboardByToken(req, res) {
    const { token } = req.params;
    try {
      // Query untuk dashboard dan questions
      const queryText = `
        SELECT 
          d.id as dashboard_id, 
          d.name, 
          d.description,
          dq.id as instance_id,
          dq.question_id,
          dq.layout_config,
          dq.filter_mappings,
          q.name as question_name,
          q.chart_type
        FROM dashboards d
        LEFT JOIN dashboard_questions dq ON d.id = dq.dashboard_id
        LEFT JOIN questions q ON dq.question_id = q.id
        WHERE d.public_token = $1 AND d.public_sharing_enabled = TRUE;
      `;
      const result = await pool.query(queryText, [token]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Dashboard publik tidak ditemukan atau tidak aktif.",
        });
      }

      // Query untuk filters
      const filtersQuery = `
        SELECT id, name, display_name, type, options, operator
        FROM dashboard_filters
        WHERE dashboard_id = $1
        ORDER BY id ASC;
      `;
      const dashboardId = result.rows[0].dashboard_id;
      const filtersResult = await pool.query(filtersQuery, [dashboardId]);

      const processedDashboardData = {
        id: result.rows[0].dashboard_id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        filters: filtersResult.rows,
        questions: result.rows[0].question_id
          ? result.rows.map((row) => ({
              instance_id: row.instance_id,
              id: row.question_id,
              name: row.question_name,
              chart_type: row.chart_type,
              layout: row.layout_config,
              filter_mappings: row.filter_mappings || {},
            }))
          : [],
      };

      res.status(200).json(processedDashboardData);
    } catch (error) {
      console.error(
        `[PUBLIC_CONTROLLER_ERROR] Gagal mengambil dashboard publik dengan token ${token}:`,
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
   * @description Get question details for public dashboard
   * @route GET /api/public/dashboards/:token/questions/:questionId
   */
  static async getPublicQuestion(req, res) {
    const { token, questionId } = req.params;

    try {
      // 1. Verify dashboard is public and token is valid
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

      // 2. Verify question belongs to this dashboard
      const questionCheck = await pool.query(
        `SELECT dq.question_id 
         FROM dashboard_questions dq
         WHERE dq.dashboard_id = $1 AND dq.question_id = $2`,
        [dashboardId, questionId]
      );

      if (questionCheck.rows.length === 0) {
        return res.status(403).json({
          message: "Question does not belong to this dashboard.",
        });
      }

      // 3. Get question details with click behavior
      const questionQuery = `
        SELECT 
          q.id, q.name, q.sql_query, q.chart_type, q.chart_config,
          c.id as connection_id, c.connection_name, c.db_type, 
          c.host, c.port, c.db_user, c.database_name, c.password_encrypted,
          qcb.enabled as click_enabled,
          qcb.action as click_action,
          qcb.target_id as click_target_id,
          qcb.target_url as click_target_url,
          qcb.pass_column as click_pass_column,
          qcb.target_param as click_target_param
        FROM questions q
        JOIN database_connections c ON q.connection_id = c.id
        LEFT JOIN question_click_behaviors qcb ON q.id = qcb.question_id
        WHERE q.id = $1
      `;

      const questionResult = await pool.query(questionQuery, [questionId]);

      if (questionResult.rows.length === 0) {
        return res.status(404).json({ message: "Question not found." });
      }

      const row = questionResult.rows[0];

      // Structure response (without sensitive connection details)
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
              pass_column: row.click_pass_column,
              target_param: row.click_target_param,
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
   * @description Run query for public dashboard question
   * @route POST /api/public/dashboards/:token/questions/:questionId/run
   */
  static async runPublicQuery(req, res) {
    const { token, questionId } = req.params;
    const { parameters = {} } = req.body;

    let targetConnection;

    try {
      // 1. Verify dashboard is public
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

      // 2. Verify question belongs to dashboard
      const questionCheck = await pool.query(
        `SELECT dq.question_id FROM dashboard_questions dq
         WHERE dq.dashboard_id = $1 AND dq.question_id = $2`,
        [dashboardId, questionId]
      );

      if (questionCheck.rows.length === 0) {
        return res.status(403).json({
          message: "Question does not belong to this dashboard.",
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
        execSql = `${finalSql.trim()} LIMIT ${limit}`;
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
      console.error("Error executing public query:", error);
      res.status(500).json({
        message: "Failed to execute query",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    } finally {
      if (targetConnection && targetConnection.end) {
        await targetConnection.end();
      } else if (targetConnection && targetConnection.close) {
        await targetConnection.close();
      }
    }
  }
}

module.exports = PublicController;
