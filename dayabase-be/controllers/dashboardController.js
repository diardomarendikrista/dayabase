const DashboardService = require("../services/DashboardService");
const logger = require("../utils/logger");

class DashboardController {
  /**
   * @description Create a new dashboard
   * @route POST /api/dashboards
   */
  static async createDashboard(req, res) {
    const { name, description, collection_id } = req.body;
    const userId = req.user.id;

    try {
      const newDashboard = await DashboardService.createDashboard(userId, { name, description, collection_id });
      res.status(201).json(newDashboard);
    } catch (error) {
      if (error.message.includes("Required")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error creating dashboard", error: error.message });
    }
  }

  /**
   * @description Retrieve a list of all dashboards
   * @route GET /api/dashboards
   */
  static async getAllDashboards(req, res) {
    const { collectionId } = req.query;
    try {
      const dashboards = await DashboardService.getAllDashboards(collectionId);
      res.status(200).json(dashboards);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboards", error: error.message });
    }
  }

  /**
   * @description Retrieve details of a dashboard, including its questions and layout
   * @route GET /api/dashboards/:id
   */
  static async getDashboardById(req, res) {
    const { id } = req.params;

    try {
      const dashboard = await DashboardService.getDashboardById(id);
      if (!dashboard) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan" });
      }
      res.status(200).json(dashboard);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard details", error: error.message });
    }
  }

  /**
   * @description Update dashboard name or description
   * @route PUT /api/dashboards/:id
   */
  static async updateDashboard(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    try {
      const updated = await DashboardService.updateDashboard(id, userId, { name, description });
      if (!updated) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan." });
      }
      res.status(200).json(updated);
    } catch (error) {
      if (error.message.includes("wajib diisi")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error updating dashboard", error: error.message });
    }
  }

  /**
   * @description Delete a dashboard
   * @route DELETE /api/dashboards/:id
   */
  static async deleteDashboard(req, res) {
    const { id } = req.params;
    try {
      const success = await DashboardService.deleteDashboard(id);
      if (!success) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan." });
      }
      res.status(200).json({ message: "Dashboard berhasil dihapus." });
    } catch (error) {
      res.status(500).json({ message: "Error deleting dashboard", error: error.message });
    }
  }

  // --- Methods for Managing Dashboard Content ---

  /**
   * @description Add a question to the dashboard
   * @route POST /api/dashboards/:id/questions
   */
  static async addQuestionToDashboard(req, res) {
    const { id: dashboard_id } = req.params;
    const { question_id, layoutConfig } = req.body;

    try {
      const result = await DashboardService.addQuestionToDashboard(dashboard_id, { question_id, layoutConfig });
      res.status(201).json(result);
    } catch (error) {
      if (error.message.includes("wajib diisi")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error adding question", error: error.message });
    }
  }

  /**
   * @description Update the layout of all questions on the dashboard
   * @route PUT /api/dashboards/:id/layout
   */
  static async updateDashboardLayout(req, res) {
    const { id: dashboard_id } = req.params;
    const layout = req.body;
    const userId = req.user.id;

    try {
      await DashboardService.updateDashboardLayout(dashboard_id, userId, layout);
      res.status(200).json({ message: "Layout dashboard berhasil diperbarui." });
    } catch (error) {
      if (error.message.includes("array")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error updating layout", error: error.message });
    }
  }

  /**
   * @description Remove a question from the dashboard
   * @route DELETE /api/dashboards/:id/questions/:questionId
   */
  static async removeQuestionFromDashboard(req, res) {
    const { dashboardId, instanceId } = req.params; // Note: original code used instanceId as param name in route logs? No, route matches params
    // Wait, original route was /:id/questions/:questionId. 
    // Wait, let's check routes file or original controller.
    // Original controller used: const { id: dashboard_id } = req.params; const { question_id, layoutConfig } = req.body; for add
    // For remove: const { dashboardId, instanceId } = req.params;
    // Route definition likely expects /:dashboardId/questions/:instanceId or similar.
    // Let's assume params match route definition.

    try {
      const success = await DashboardService.removeQuestionFromDashboard(dashboardId, instanceId);
      if (!success) {
        return res.status(404).json({ message: "Question tidak ditemukan di dashboard ini." });
      }
      res.status(200).json({ message: "Question berhasil dihapus dari dashboard." });
    } catch (error) {
      res.status(500).json({ message: "Error removing question", error: error.message });
    }
  }

  /**
   * @description Update dashboard sharing status
   * @route PUT /api/dashboards/:id/sharing
   */
  static async updateSharingStatus(req, res) {
    const { id } = req.params;
    const { enabled } = req.body;

    try {
      const result = await DashboardService.updateSharingStatus(id, enabled);
      if (!result) {
        return res.status(404).json({ message: "Dashboard tidak ditemukan." });
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error updating sharing status", error: error.message });
    }
  }

  // ---------- Filter Methods ----------

  /**
   * @description Add a new filter to the dashboard
   * @route POST /api/dashboards/:id/filters
   */
  static async addFilterToDashboard(req, res) {
    const { id: dashboard_id } = req.params;
    const { name, display_name, type, options, operator } = req.body;
    const userId = req.user.id;

    try {
      const result = await DashboardService.addFilterToDashboard(dashboard_id, userId, { name, display_name, type, options, operator });
      res.status(201).json(result);
    } catch (error) {
      if (error.message.includes("required")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error adding filter", error: error.message });
    }
  }

  /**
   * @description Update an existing filter on the dashboard
   * @route PUT /api/dashboards/:id/filters/:filterId
   */
  static async updateFilterOnDashboard(req, res) {
    const { id: dashboard_id, filterId } = req.params;
    const { name, display_name, type, options, operator } = req.body;
    const userId = req.user.id;

    try {
      const result = await DashboardService.updateFilterOnDashboard(dashboard_id, filterId, userId, { name, display_name, type, options, operator });
      if (!result) {
        return res.status(404).json({ message: "Filter not found on this dashboard." });
      }
      res.status(200).json(result);
    } catch (error) {
      if (error.message.includes("required")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error updating filter", error: error.message });
    }
  }

  /**
   * @description Delete a filter from the dashboard
   * @route DELETE /api/dashboards/:id/filters/:filterId
   */
  static async deleteFilterFromDashboard(req, res) {
    const { id: dashboard_id, filterId } = req.params;
    const userId = req.user.id;
    try {
      const success = await DashboardService.deleteFilterFromDashboard(dashboard_id, filterId, userId);
      if (!success) {
        return res.status(404).json({ message: "Filter not found on this dashboard." });
      }
      res.status(200).json({ message: "Filter deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Error deleting filter", error: error.message });
    }
  }

  /**
   * @description Update filter mappings for a single question on the dashboard
   * @route PUT /api/dashboards/:id/questions/:instanceId/mappings
   */
  static async updateFilterMappings(req, res) {
    const { id: dashboard_id, instanceId } = req.params;
    const filterMappings = req.body;
    const userId = req.user.id;

    try {
      const result = await DashboardService.updateFilterMappings(dashboard_id, instanceId, userId, filterMappings);
      if (!result) {
        return res.status(404).json({ message: "Question instance not found on this dashboard." });
      }
      res.status(200).json(result);
    } catch (error) {
      if (error.message.includes("valid JSON")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error updating filter mappings", error: error.message });
    }
  }
}

module.exports = DashboardController;
