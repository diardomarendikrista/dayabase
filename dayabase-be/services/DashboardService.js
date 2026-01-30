const pool = require("../config/db");

class DashboardService {
  /**
   * Create new dashboard
   */
  async createDashboard(userId, { name, description, collection_id }) {
    if (!name) {
      throw new Error("Dashboard Name Required");
    }

    const newDashboard = await pool.query(
      "INSERT INTO dashboards (name, description, collection_id, updated_by_user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description || null, collection_id || null, userId]
    );
    return newDashboard.rows[0];
  }

  /**
   * Get all dashboards
   */
  async getAllDashboards(collectionId = null) {
    let queryText = "SELECT id, name, description, created_at FROM dashboards";
    const queryParams = [];

    if (collectionId) {
      queryText += " WHERE collection_id = $1 OR collection_id IS NULL";
      queryParams.push(collectionId);
    }

    queryText += " ORDER BY name ASC";
    const allDashboards = await pool.query(queryText, queryParams);
    return allDashboards.rows;
  }

  /**
   * Get dashboard by ID
   */
  async getDashboardById(id) {
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

    if (result.rows.length === 0) return null;

    // Query for filters
    const filtersQuery = `
     SELECT id, name, display_name, type, options, operator
     FROM dashboard_filters
     WHERE dashboard_id = $1
     ORDER BY id ASC;
   `;
    const filtersResult = await pool.query(filtersQuery, [id]);

    return {
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
  }

  /**
   * Update dashboard
   */
  async updateDashboard(id, userId, { name, description }) {
    if (!name) {
      throw new Error("Nama dashboard wajib diisi.");
    }
    const updatedDashboard = await pool.query(
      "UPDATE dashboards SET name = $1, description = $2, updated_at = NOW(), updated_by_user_id = $3 WHERE id = $4 RETURNING *",
      [name, description, userId, id]
    );
    if (updatedDashboard.rowCount === 0) return null;
    return updatedDashboard.rows[0];
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(id) {
    const deleteOp = await pool.query(
      "DELETE FROM dashboards WHERE id = $1 RETURNING *",
      [id]
    );
    return deleteOp.rowCount > 0;
  }

  /**
   * Add question to dashboard
   */
  async addQuestionToDashboard(dashboard_id, { question_id, layoutConfig }) {
    if (!question_id) throw new Error("question_id wajib diisi.");

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

      return {
        instance_id: newLinkResult.rows[0].instance_id,
        id: newLinkResult.rows[0].question_id,
        name: newLinkResult.rows[0].question_name,
        chart_type: newLinkResult.rows[0].chart_type,
        layout: newLinkResult.rows[0].layout_config,
      };

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update Layout
   */
  async updateDashboardLayout(dashboard_id, userId, layout) {
    if (!Array.isArray(layout)) throw new Error("Body harus berupa array layout.");

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
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove question from dashboard
   */
  async removeQuestionFromDashboard(dashboardId, instanceId) {
    const deleteOp = await pool.query(
      "DELETE FROM dashboard_questions WHERE id = $1 AND dashboard_id = $2 RETURNING *",
      [instanceId, dashboardId]
    );
    return deleteOp.rowCount > 0;
  }

  /**
   * Update sharing status
   */
  async updateSharingStatus(id, enabled) {
    const result = await pool.query(
      "UPDATE dashboards SET public_sharing_enabled = $1 WHERE id = $2 RETURNING id, public_sharing_enabled, public_token",
      [enabled, id]
    );
    if (result.rowCount === 0) return null;
    return result.rows[0];
  }

  // --- Filter Methods ---
  async addFilterToDashboard(dashboard_id, userId, { name, display_name, type, options, operator }) {
    if (!name || !display_name || !type) {
      throw new Error("Filter name, display_name, and type are required.");
    }
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

    await pool.query(
      "UPDATE dashboards SET updated_at = NOW(), updated_by_user_id = $1 WHERE id = $2",
      [userId, dashboard_id]
    );
    return newFilter.rows[0];
  }

  async updateFilterOnDashboard(dashboard_id, filterId, userId, { name, display_name, type, options, operator }) {
    if (!name || !display_name || !type) {
      throw new Error("Filter name, display_name, and type are required.");
    }
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

    if (updatedFilter.rowCount === 0) return null;

    await pool.query(
      "UPDATE dashboards SET updated_at = NOW(), updated_by_user_id = $1 WHERE id = $2",
      [userId, dashboard_id]
    );

    return updatedFilter.rows[0];
  }

  async deleteFilterFromDashboard(dashboard_id, filterId, userId) {
    const deleteOp = await pool.query(
      "DELETE FROM dashboard_filters WHERE id = $1 AND dashboard_id = $2 RETURNING *",
      [filterId, dashboard_id]
    );

    if (deleteOp.rowCount === 0) return false;

    // Optional: remove mapping
    await pool.query(
      `UPDATE dashboard_questions
           SET filter_mappings = filter_mappings - $1::text
           WHERE dashboard_id = $2 AND filter_mappings ? $1::text`,
      [filterId, dashboard_id]
    );

    await pool.query(
      "UPDATE dashboards SET updated_at = NOW(), updated_by_user_id = $1 WHERE id = $2",
      [userId, dashboard_id]
    );
    return true;
  }

  async updateFilterMappings(dashboard_id, instanceId, userId, filterMappings) {
    if (typeof filterMappings !== "object" || filterMappings === null) {
      throw new Error("Filter mappings must be a valid JSON object.");
    }
    const updatedMapping = await pool.query(
      "UPDATE dashboard_questions SET filter_mappings = $1 WHERE id = $2 AND dashboard_id = $3 RETURNING *",
      [JSON.stringify(filterMappings), instanceId, dashboard_id]
    );

    if (updatedMapping.rowCount === 0) return null;

    await pool.query(
      "UPDATE dashboards SET updated_at = NOW(), updated_by_user_id = $1 WHERE id = $2",
      [userId, dashboard_id]
    );
    return updatedMapping.rows[0];
  }
}

module.exports = new DashboardService();
