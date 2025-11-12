const express = require("express");
const router = express.Router();
const QuestionController = require("../controllers/questionController");

router.get("/", QuestionController.getAllQuestions);
router.get("/:id", QuestionController.getQuestionById);
router.post("/", QuestionController.createQuestion);
router.put("/:id", QuestionController.updateQuestion);
router.delete("/:id", QuestionController.deleteQuestion);

router.put("/:id/click-behavior", QuestionController.updateClickBehavior);
router.get("/:id/click-behavior", QuestionController.getClickBehavior);
router.delete("/:id/click-behavior", QuestionController.deleteClickBehavior);
router.post("/validate-target", QuestionController.validateTarget);

module.exports = router;
