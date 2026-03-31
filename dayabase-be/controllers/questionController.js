const QuestionService = require("../services/QuestionService");

class QuestionController {
  /**
   * @description Save a new question to the database
   * @route POST /api/questions
   */
  static async createQuestion(req, res) {
    const {
      name,
      sql_query,
      chart_type,
      chart_config,
      connection_id,
      collection_id,
    } = req.body;
    const userId = req.user.id;

    if (!name || !sql_query || !chart_type || !chart_config || !connection_id) {
      return res.status(400).json({
        message: "All fields are required: name, sql_query, chart_type, chart_config, connection_id",
      });
    }

    try {
      const newQuestion = await QuestionService.createQuestion(userId, { name, sql_query, chart_type, chart_config, connection_id, collection_id });
      res.status(201).json(newQuestion);
    } catch (error) {
      res.status(500).json({ message: "Error creating question", error: error.message });
    }
  }

  /**
   * @description Retrieve all questions (basic info only)
   * @route GET /api/questions
   */
  static async getAllQuestions(req, res) {
    const { collectionId } = req.query;
    try {
      const questions = await QuestionService.getAllQuestions(collectionId);
      res.status(200).json(questions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching questions", error: error.message });
    }
  }

  /**
   * @description Get question with click behavior (for dashboard/public view)
   * @route GET /api/questions/:id
   */
  static async getQuestionById(req, res) {
    const { id } = req.params;

    try {
      const row = await QuestionService.getQuestionDetail(id);

      if (!row) {
        return res.status(404).json({ message: "Question not found" });
      }

      // 1. Compatibility logic for parameter mappings
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

      // 2. Construct response object
      const response = {
        id: row.id,
        name: row.name,
        sql_query: row.sql_query,
        chart_type: row.chart_type,
        chart_config: row.chart_config,
        updated_at: row.updated_at,

        // Connection Info
        connection_id: row.connection_id,
        connection_name: row.connection_name,
        db_type: row.db_type,
        host: row.host,
        port: row.port,
        db_user: row.db_user,
        database_name: row.database_name,

        // Collection Info
        collection_id: row.collection_id,
        collection_name: row.collection_name,

        // Click Behavior Info
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
      res.status(500).json({ message: "Error fetching question details", error: error.message });
    }
  }

  /**
   * @description Delete a question
   * @route DELETE /api/questions/:id
   */
  static async deleteQuestion(req, res) {
    const { id } = req.params;

    try {
      const success = await QuestionService.deleteQuestion(id);
      if (!success) {
        return res.status(404).json({ message: "Question not found, nothing to delete." });
      }
      res.status(200).json({ message: `Question with id ${id} deleted successfully.` });
    } catch (error) {
      res.status(500).json({ message: "Error deleting question", error: error.message });
    }
  }

  /**
   * @description Update an existing question
   * @route PUT /api/questions/:id
   */
  static async updateQuestion(req, res) {
    const { id } = req.params;
    const { name, sql_query, chart_type, chart_config, connection_id } = req.body;
    const userId = req.user.id;

    if (!name || !sql_query || !chart_type || !chart_config || !connection_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const updated = await QuestionService.updateQuestion(id, userId, { name, sql_query, chart_type, chart_config, connection_id });
      if (!updated) {
        return res.status(404).json({ message: "Question not found, nothing to update." });
      }
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ message: "Error updating question", error: error.message });
    }
  }

  /**
   * @description Update or create click behavior configuration
   * @route PUT /api/questions/:id/click-behavior
   */
  static async updateClickBehavior(req, res) {
    const { id: question_id } = req.params;
    const { enabled, action, target_id, target_url, parameter_mappings } = req.body;
    const userId = req.user.id;

    // Validation logic stays in controller for input checking before service call? 
    // Or move to service? Usually input validation is controller or middleware.
    if (enabled && !action) {
      return res.status(400).json({ message: "Action is required when click behavior is enabled." });
    }
    if (enabled && action !== "external_url" && !target_id) {
      return res.status(400).json({ message: "Target ID is required for this action type." });
    }
    if (enabled && action !== "external_url") {
      if (!parameter_mappings || !Array.isArray(parameter_mappings)) {
        return res.status(400).json({ message: "Parameter mappings must be an array." });
      }
    }

    try {
      const result = await QuestionService.updateClickBehavior(question_id, userId, { enabled, action, target_id, target_url, parameter_mappings });
      if (!result && result !== false) { // Service returns null if not found
        return res.status(404).json({ message: "Question not found." });
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Error updating click behavior", error: error.message });
    }
  }

  /**
   * @description Get click behavior configuration
   * @route GET /api/questions/:id/click-behavior
   */
  static async getClickBehavior(req, res) {
    const { id: question_id } = req.params;

    try {
      const row = await QuestionService.getClickBehavior(question_id);

      if (!row) {
        return res.status(200).json({
          question_id: parseInt(question_id),
          enabled: false,
          action: null,
          target_id: null,
          target_url: null,
          parameter_mappings: [],
        });
      }

      let mappings = row.parameter_mappings;
      // Fallback compatibility logic
      if (
        (!mappings || mappings.length === 0) &&
        row.pass_column &&
        row.target_param
      ) {
        mappings = [
          { passColumn: row.pass_column, targetParam: row.target_param },
        ];
      }

      res.status(200).json({
        ...row,
        parameter_mappings: mappings || [],
      });

    } catch (error) {
      res.status(500).json({ message: "Error fetching click behavior", error: error.message });
    }
  }

  /**
   * @description Delete click behavior
   * @route DELETE /api/questions/:id/click-behavior
   */
  static async deleteClickBehavior(req, res) {
    const { id: question_id } = req.params;
    try {
      const success = await QuestionService.deleteClickBehavior(question_id);
      if (!success) {
        return res.status(404).json({ message: "No click behavior found for this question." });
      }
      res.status(200).json({ message: "Click behavior deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Error deleting click behavior", error: error.message });
    }
  }

  /**
   * @description Validate target (question/dashboard) exists
   * @route POST /api/questions/validate-target
   */
  static async validateTarget(req, res) {
    const { action, target_id } = req.body;

    if (!action || !target_id) {
      return res.status(400).json({ message: "Action and target_id are required." });
    }

    try {
      const result = await QuestionService.validateTarget(action, target_id);

      if (!result.valid) {
        return res.status(404).json({
          message: `Target not found.`,
          valid: false,
        });
      }

      res.status(200).json(result);

    } catch (error) {
      if (error.message === "Invalid action type.") {
        return res.status(400).json({ message: "Invalid action type." });
      }
      res.status(500).json({ message: "Error validating target", error: error.message });
    }
  }
}

module.exports = QuestionController;
