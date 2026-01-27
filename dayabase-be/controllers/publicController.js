const PublicDashboardService = require("../services/PublicDashboardService");
const logger = require("../utils/logger");

class PublicController {
  /**
   * @description Get Public Dashboard Data by Token
   * @route GET /api/public/dashboards/:token
   */
  static async getPublicDashboard(req, res) {
    const { token } = req.params;

    try {
      // 1. Get Dashboard Info
      const dashboard = await PublicDashboardService.getDashboardByToken(token);

      if (!dashboard) {
        return res.status(404).json({ message: "Dashboard not found." });
      }

      if (!dashboard.public_sharing_enabled) {
        return res
          .status(403)
          .json({ message: "This dashboard is not publicly shared." });
      }

      // 2. Get Filters & Questions
      const filters = await PublicDashboardService.getDashboardFilters(dashboard.id);
      const questions = await PublicDashboardService.getDashboardQuestions(dashboard.id);

      res.status(200).json({
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        filters,
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
   * @description Get question details for public dashboard
   * @route GET /api/public/dashboards/:token/questions/:questionId
   */
  static async getPublicQuestion(req, res) {
    const { token, questionId } = req.params;

    try {
      // Verify dashboard
      const dashboard = await PublicDashboardService.getDashboardByToken(token);

      if (!dashboard || !dashboard.public_sharing_enabled) {
        return res.status(404).json({
          message: "Dashboard not found or sharing is disabled.",
        });
      }

      // Check Access
      const isAccessible = await PublicDashboardService.isQuestionAccessible(
        dashboard.id,
        questionId
      );

      if (!isAccessible) {
        return res.status(403).json({
          message: "Question is not accessible from this dashboard.",
        });
      }

      // Get Question Details
      const question = await PublicDashboardService.getQuestionDetails(questionId);

      if (!question) {
        return res.status(404).json({ message: "Question not found." });
      }

      res.status(200).json(question);
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

    try {
      // Verify dashboard
      const dashboard = await PublicDashboardService.getDashboardByToken(token);

      if (!dashboard || !dashboard.public_sharing_enabled) {
        return res.status(404).json({
          message: "Dashboard not found or sharing is disabled.",
        });
      }

      // Check Access
      const isAccessible = await PublicDashboardService.isQuestionAccessible(
        dashboard.id,
        questionId
      );

      if (!isAccessible) {
        return res.status(403).json({
          message: "Question is not accessible from this dashboard.",
        });
      }

      // Execute Query
      const results = await PublicDashboardService.executeQuestionQuery(questionId, parameters);
      res.status(200).json(results);

    } catch (error) {
      logger.error("Error executing public query:", error);
      const status = error.message.includes("not found") ? 404 :
        error.message.includes("allowed") ? 400 : 500;

      res.status(status).json({
        message: "Failed to execute query",
        error: error.message,
      });
    }
  }
}

module.exports = PublicController;
