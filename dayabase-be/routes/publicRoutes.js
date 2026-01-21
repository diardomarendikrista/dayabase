const express = require("express");
const router = express.Router();

const PublicController = require("../controllers/publicController");

router.get("/dashboards/:token", PublicController.getPublicDashboard);
router.get(
  "/dashboards/:token/questions/:questionId",
  PublicController.getPublicQuestion
);
router.post(
  "/dashboards/:token/questions/:questionId/run",
  PublicController.runPublicQuery
);

module.exports = router;
