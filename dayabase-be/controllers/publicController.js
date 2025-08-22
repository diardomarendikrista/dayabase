const pool = require("../config/db");

class PublicController {
  /**
   * @description Mengambil data dashboard publik berdasarkan token
   * @route GET /api/public/dashboards/:token
   */
  static async getPublicDashboardByToken(req, res) {
    const { token } = req.params;
    try {
      const queryText = `
        SELECT 
          d.id as dashboard_id, d.name, d.description,
          dq.question_id,
          dq.layout_config
        FROM dashboards d
        LEFT JOIN dashboard_questions dq ON d.id = dq.dashboard_id
        WHERE d.public_token = $1 AND d.public_sharing_enabled = TRUE;
      `;
      const result = await pool.query(queryText, [token]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Dashboard publik tidak ditemukan atau tidak aktif.",
        });
      }

      const processedDashboardData = {
        id: result.rows[0].dashboard_id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        questions: result.rows[0].question_id
          ? result.rows.map((row) => ({
              id: row.question_id,
              layout: row.layout_config,
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
        // Kirim detail error ke frontend (hanya saat development)
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = PublicController;
