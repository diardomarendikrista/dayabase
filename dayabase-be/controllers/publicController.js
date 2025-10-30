// controllers/publicController.js
const pool = require("../config/db");

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
        SELECT id, name, display_name, type, options
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
}

module.exports = PublicController;
