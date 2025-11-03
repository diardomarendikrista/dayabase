const pool = require("../config/db");

class DashboardController {
  /**
   * @description Membuat dashboard baru
   * @route POST /api/dashboards
   */
  static async createDashboard(req, res) {
    const { name, description, collection_id } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: "Dashboard Name Required" });
    }
    try {
      const newDashboard = await pool.query(
        "INSERT INTO dashboards (name, description, collection_id, updated_by_user_id) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, description || null, collection_id || null, userId]
      );
      res.status(201).json(newDashboard.rows[0]);
    } catch (error) {
      console.error("Gagal membuat dashboard:", error);
      res
        .status(500)
        .json({ message: "Gagal membuat dashboard", error: error.message });
    }
  }

  /**
   * @description Mengambil daftar semua dashboard
   * @route GET /api/dashboards
   */
  static async getAllDashboards(req, res) {
    const { collectionId } = req.query;

    try {
      let queryText =
        "SELECT id, name, description, created_at FROM dashboards";
      const queryParams = [];

      // Jika ada collectionId, tambahkan filter WHERE
      if (collectionId) {
        queryText += " WHERE collection_id = $1 OR collection_id IS NULL";
        queryParams.push(collectionId);
      }

      queryText += " ORDER BY name ASC";

      const allDashboards = await pool.query(queryText, queryParams);
      res.status(200).json(allDashboards.rows);
    } catch (error) {
      console.error("Gagal mengambil dashboards:", error);
      res
        .status(500)
        .json({ message: "Gagal mengambil dashboards", error: error.message });
    }
  }

  /**
   * @description Mengambil detail satu dashboard beserta question dan layoutnya
   * @route GET /api/dashboards/:id
   */

  static async getDashboardById(req, res) {
    const { id } = req.params;
    try {
      // Query untuk dashboard dan questions
      const queryText = `
      SELECT
        d.id as dashboard_id, d.name, d.description, d.public_sharing_enabled, d.public_token,
        d.collection_id,
        c.name as collection_name,
        dq.id as instance_id,
        dq.question_id, q.name as question_name, q.chart_type,
        dq.layout_config,
        dq.filter_mappings
      FROM dashboards d
      LEFT JOIN dashboard_questions dq ON d.id = dq.dashboard_id
      LEFT JOIN questions q ON dq.question_id = q.id
      LEFT JOIN collections c ON d.collection_id = c.id
      WHERE d.id = $1;
    `;
      const result = await pool.query(queryText, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan" });
      }

      // Query untuk filters
      const filtersQuery = `
        SELECT id, name, display_name, type, options, operator
        FROM dashboard_filters
        WHERE dashboard_id = $1
        ORDER BY id ASC;
      `;
      const filtersResult = await pool.query(filtersQuery, [id]);

      const dashboardData = {
        id: result.rows[0].dashboard_id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        collection_id: result.rows[0].collection_id,
        collection_name: result.rows[0].collection_name,
        public_sharing_enabled: result.rows[0].public_sharing_enabled,
        public_token: result.rows[0].public_token,
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

      res.status(200).json(dashboardData);
    } catch (error) {
      console.error(`Gagal mengambil dashboard ${id}:`, error);
      res
        .status(500)
        .json({ message: "Gagal mengambil dashboard", error: error.message });
    }
  }

  /**
   * @description Memperbarui nama/deskripsi dashboard
   * @route PUT /api/dashboards/:id
   */
  static async updateDashboard(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: "Nama dashboard wajib diisi." });
    }
    try {
      const updatedDashboard = await pool.query(
        "UPDATE dashboards SET name = $1, description = $2, updated_at = NOW(), updated_by_user_id = $3 WHERE id = $4 RETURNING *",
        [name, description, userId, id]
      );
      if (updatedDashboard.rowCount === 0) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan." });
      }
      res.status(200).json(updatedDashboard.rows[0]);
    } catch (error) {
      console.error(`Gagal memperbarui dashboard ${id}:`, error);
      res
        .status(500)
        .json({ message: "Gagal memperbarui dashboard", error: error.message });
    }
  }

  /**
   * @description Menghapus dashboard
   * @route DELETE /api/dashboards/:id
   */
  static async deleteDashboard(req, res) {
    const { id } = req.params;
    try {
      const deleteOp = await pool.query(
        "DELETE FROM dashboards WHERE id = $1 RETURNING *",
        [id]
      );
      if (deleteOp.rowCount === 0) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan." });
      }
      res.status(200).json({ message: "Dashboard berhasil dihapus." });
    } catch (error) {
      console.error(`Gagal menghapus dashboard ${id}:`, error);
      res
        .status(500)
        .json({ message: "Gagal menghapus dashboard", error: error.message });
    }
  }

  // --- Metode untuk Mengelola Isi Dashboard ---

  /**
   * @description Menambahkan question ke dashboard
   * @route POST /api/dashboards/:id/questions
   */
  static async addQuestionToDashboard(req, res) {
    const { id: dashboard_id } = req.params;
    const { question_id, layoutConfig } = req.body;

    if (!question_id) {
      return res.status(400).json({ message: "question_id wajib diisi." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existingLayouts = await client.query(
        "SELECT layout_config FROM dashboard_questions WHERE dashboard_id = $1",
        [dashboard_id]
      );

      let nextY = 0;
      if (existingLayouts.rows.length > 0) {
        nextY = Math.max(
          ...existingLayouts.rows.map((row) => {
            const layout = row.layout_config;
            return (layout.y || 0) + (layout.h || 0);
          })
        );
      }

      const newLayoutConfig = {
        x: 0,
        y: nextY,
        w: 12,
        h: 10,
        ...layoutConfig,
      };

      const newLinkQuery = `
        WITH new_row AS (
          INSERT INTO dashboard_questions (dashboard_id, question_id, layout_config) 
          VALUES ($1, $2, $3) 
          RETURNING id as instance_id, question_id, layout_config
        )
        SELECT 
          nr.instance_id, 
          nr.question_id, 
          nr.layout_config,
          q.name as question_name,
          q.chart_type
        FROM new_row nr
        JOIN questions q ON nr.question_id = q.id;
      `;

      const newLinkResult = await client.query(newLinkQuery, [
        dashboard_id,
        question_id,
        JSON.stringify(newLayoutConfig),
      ]);

      await client.query("COMMIT");

      const responseData = {
        instance_id: newLinkResult.rows[0].instance_id,
        id: newLinkResult.rows[0].question_id,
        name: newLinkResult.rows[0].question_name,
        chart_type: newLinkResult.rows[0].chart_type,
        layout: newLinkResult.rows[0].layout_config,
      };

      res.status(201).json(responseData);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(
        `Gagal menambah question ke dashboard ${dashboard_id}:`,
        error
      );
      res.status(500).json({
        message: "Gagal menambah question ke dashboard",
        error: error.message,
      });
    } finally {
      client.release();
    }
  }

  /**
   * @description Memperbarui layout dari semua question di dashboard
   * @route PUT /api/dashboards/:id/layout
   */
  static async updateDashboardLayout(req, res) {
    const { id: dashboard_id } = req.params;
    const layout = req.body;
    const userId = req.user.id;

    if (!Array.isArray(layout)) {
      return res
        .status(400)
        .json({ message: "Body harus berupa array layout." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await Promise.all(
        layout.map((item) => {
          const { i: instance_id, ...gridProps } = item;
          if (
            typeof instance_id === "number" ||
            !instance_id.toString().startsWith("temp_")
          ) {
            return client.query(
              "UPDATE dashboard_questions SET layout_config = $1 WHERE id = $2 AND dashboard_id = $3",
              [JSON.stringify(gridProps), instance_id, dashboard_id]
            );
          }
          return Promise.resolve();
        })
      );

      await client.query(
        "UPDATE dashboards SET updated_at = NOW(), updated_by_user_id = $1 WHERE id = $2",
        [userId, dashboard_id]
      );

      await client.query("COMMIT");
      res
        .status(200)
        .json({ message: "Layout dashboard berhasil diperbarui." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(
        `Gagal memperbarui layout dashboard ${dashboard_id}:`,
        error
      );
      res
        .status(500)
        .json({ message: "Gagal memperbarui layout", error: error.message });
    } finally {
      client.release();
    }
  }

  /**
   * @description Menghapus question dari dashboard
   * @route DELETE /api/dashboards/:id/questions/:questionId
   */
  static async removeQuestionFromDashboard(req, res) {
    const { dashboardId, instanceId } = req.params;
    try {
      const deleteOp = await pool.query(
        "DELETE FROM dashboard_questions WHERE id = $1 AND dashboard_id = $2 RETURNING *",
        [instanceId, dashboardId]
      );
      if (deleteOp.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Question tidak ditemukan di dashboard ini." });
      }
      res
        .status(200)
        .json({ message: "Question berhasil dihapus dari dashboard." });
    } catch (error) {
      console.error(
        `Gagal menghapus question instance ${instanceId} dari dashboard ${dashboardId}:`,
        error
      );
      res.status(500).json({
        message: "Gagal menghapus question dari dashboard",
        error: error.message,
      });
    }
  }

  /**
   * @description Mengubah status sharing dashboard
   * @route PUT /api/dashboards/:id/sharing
   */
  static async updateSharingStatus(req, res) {
    const { id } = req.params;
    const { enabled } = req.body;

    try {
      const result = await pool.query(
        "UPDATE dashboards SET public_sharing_enabled = $1 WHERE id = $2 RETURNING id, public_sharing_enabled, public_token",
        [enabled, id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan." });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ message: "Gagal memperbarui status sharing." });
    }
  }

  // ---------- Filter Method ----------

  /**
   * @description Menambahkan filter baru ke dashboard
   * @route POST /api/dashboards/:id/filters
   */
  static async addFilterToDashboard(req, res) {
    const { id: dashboard_id } = req.params;
    const { name, display_name, type, options, operator } = req.body;
    const userId = req.user.id;

    if (!name || !display_name || !type) {
      return res
        .status(400)
        .json({ message: "Filter name, display_name, and type are required." });
    }
    // TODO: Tambahkan validasi tipe filter jika perlu

    try {
      // Pastikan dashboard milik user (sekarang tidak ada fungsi ini)
      // const dashboardCheck = await pool.query(
      //   "SELECT user_id FROM dashboards WHERE id = $1",
      //   [dashboard_id]
      // );

      // if (
      //   dashboardCheck.rowCount === 0 ||
      //   dashboardCheck.rows[0].user_id !== userId
      // ) {
      //   return res
      //     .status(403)
      //     .json({ message: "Cannot add filter to a dashboard you don't own." });
      // }

      const newFilter = await pool.query(
        "INSERT INTO dashboard_filters (dashboard_id, name, display_name, type, options, operator) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          dashboard_id,
          name,
          display_name,
          type,
          JSON.stringify(options),
          operator,
        ]
      );

      // Update dashboard's updated_at timestamp
      await pool.query(
        "UPDATE dashboards SET updated_at = NOW(), updated_by_user_id = $1 WHERE id = $2",
        [userId, dashboard_id]
      );

      res.status(201).json(newFilter.rows[0]);
    } catch (error) {
      console.error(
        `Failed to add filter to dashboard ${dashboard_id}:`,
        error
      );
      res
        .status(500)
        .json({ message: "Failed to add filter.", error: error.message });
    }
  }

  /**
   * @description Memperbarui filter yang ada di dashboard
   * @route PUT /api/dashboards/:id/filters/:filterId
   */
  static async updateFilterOnDashboard(req, res) {
    const { id: dashboard_id, filterId } = req.params;
    const { name, display_name, type, options, operator } = req.body;
    const userId = req.user.id;

    if (!name || !display_name || !type) {
      return res
        .status(400)
        .json({ message: "Filter name, display_name, and type are required." });
    }
    // TODO: Tambahkan validasi tipe filter jika perlu

    try {
      // Pastikan dashboard milik user (sekarang tidak ada fungsi ini)
      // const dashboardCheck = await pool.query(
      //   "SELECT user_id FROM dashboards WHERE id = $1",
      //   [dashboard_id]
      // );
      // if (
      //   dashboardCheck.rowCount === 0 ||
      //   dashboardCheck.rows[0].user_id !== userId
      // ) {
      //   return res.status(403).json({
      //     message: "Cannot modify filters on a dashboard you don't own.",
      //   });
      // }

      const updatedFilter = await pool.query(
        "UPDATE dashboard_filters SET name = $1, display_name = $2, type = $3, options = $4, operator = $5 WHERE id = $6 AND dashboard_id = $7 RETURNING *",
        [
          name,
          display_name,
          type,
          JSON.stringify(options),
          operator,
          filterId,
          dashboard_id,
        ]
      );

      if (updatedFilter.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Filter not found on this dashboard." });
      }

      // Update dashboard's updated_at timestamp
      await pool.query(
        "UPDATE dashboards SET updated_at = NOW(), updated_by_user_id = $1 WHERE id = $2",
        [userId, dashboard_id]
      );

      res.status(200).json(updatedFilter.rows[0]);
    } catch (error) {
      console.error(
        `Failed to update filter ${filterId} on dashboard ${dashboard_id}:`,
        error
      );
      res
        .status(500)
        .json({ message: "Failed to update filter.", error: error.message });
    }
  }

  /**
   * @description Menghapus filter dari dashboard
   * @route DELETE /api/dashboards/:id/filters/:filterId
   */
  static async deleteFilterFromDashboard(req, res) {
    const { id: dashboard_id, filterId } = req.params;
    const userId = req.user.id;

    try {
      // Pastikan dashboard milik user (sekarang tidak ada fungsi ini)
      // const dashboardCheck = await pool.query(
      //   "SELECT user_id FROM dashboards WHERE id = $1",
      //   [dashboard_id]
      // );
      // if (
      //   dashboardCheck.rowCount === 0 ||
      //   dashboardCheck.rows[0].user_id !== userId
      // ) {
      //   return res.status(403).json({
      //     message: "Cannot modify filters on a dashboard you don't own.",
      //   });
      // }

      // Hapus filter dari tabel dashboard_filters
      const deleteOp = await pool.query(
        "DELETE FROM dashboard_filters WHERE id = $1 AND dashboard_id = $2 RETURNING *",
        [filterId, dashboard_id]
      );

      if (deleteOp.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Filter not found on this dashboard." });
      }

      // Hapus mapping filter ini dari SEMUA question di dashboard ini (opsional tapi disarankan)
      await pool.query(
        `UPDATE dashboard_questions
         SET filter_mappings = filter_mappings - $1::text -- Hapus key dari JSONB
         WHERE dashboard_id = $2 AND filter_mappings ? $1::text`, // Hanya update jika key ada
        [filterId, dashboard_id]
      );

      // Update dashboard's updated_at timestamp
      await pool.query(
        "UPDATE dashboards SET updated_at = NOW(), updated_by_user_id = $1 WHERE id = $2",
        [userId, dashboard_id]
      );

      res.status(200).json({ message: "Filter deleted successfully." });
    } catch (error) {
      console.error(
        `Failed to delete filter ${filterId} from dashboard ${dashboard_id}:`,
        error
      );
      res
        .status(500)
        .json({ message: "Failed to delete filter.", error: error.message });
    }
  }

  /**
   * @description Memperbarui mapping filter untuk satu question di dashboard
   * @route PUT /api/dashboards/:id/questions/:instanceId/mappings
   */
  static async updateFilterMappings(req, res) {
    const { id: dashboard_id, instanceId } = req.params;
    const filterMappings = req.body; // Harus berupa object JSON, e.g., {"filterId": "columnName"}
    const userId = req.user.id;

    if (typeof filterMappings !== "object" || filterMappings === null) {
      return res
        .status(400)
        .json({ message: "Filter mappings must be a valid JSON object." });
    }

    try {
      // Pastikan dashboard milik user (sekarang tidak ada fungsi ini)
      // const dashboardCheck = await pool.query(
      //   "SELECT user_id FROM dashboards WHERE id = $1",
      //   [dashboard_id]
      // );
      // if (
      //   dashboardCheck.rowCount === 0 ||
      //   dashboardCheck.rows[0].user_id !== userId
      // ) {
      //   return res.status(403).json({
      //     message: "Cannot modify mappings on a dashboard you don't own.",
      //   });
      // }

      const updatedMapping = await pool.query(
        "UPDATE dashboard_questions SET filter_mappings = $1 WHERE id = $2 AND dashboard_id = $3 RETURNING *",
        [JSON.stringify(filterMappings), instanceId, dashboard_id]
      );

      if (updatedMapping.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Question instance not found on this dashboard." });
      }

      // Update dashboard's updated_at timestamp
      await pool.query(
        "UPDATE dashboards SET updated_at = NOW(), updated_by_user_id = $1 WHERE id = $2",
        [userId, dashboard_id]
      );

      res.status(200).json(updatedMapping.rows[0]); // Kembalikan data question instance yang sudah diupdate
    } catch (error) {
      console.error(
        `Failed to update filter mappings for instance ${instanceId} on dashboard ${dashboard_id}:`,
        error
      );
      res.status(500).json({
        message: "Failed to update filter mappings.",
        error: error.message,
      });
    }
  }
}

module.exports = DashboardController;
