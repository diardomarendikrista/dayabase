const express = require("express");
const router = express.Router();

const DashboardController = require("../controllers/dashboardController");

// CRUD basic
router.get("/", DashboardController.getAllDashboards);
router.get("/:id", DashboardController.getDashboardById);
router.post("/", DashboardController.createDashboard);
router.put("/:id", DashboardController.updateDashboard);
router.delete("/:id", DashboardController.deleteDashboard);

// Manage Dasboard content
router.post("/:id/questions", DashboardController.addQuestionToDashboard);
router.put("/:id/layout", DashboardController.updateDashboardLayout);
router.delete(
  "/:dashboardId/questions/:instanceId",
  DashboardController.removeQuestionFromDashboard
);

// Embed & Share
router.put("/:id/sharing", DashboardController.updateSharingStatus);

//// FILTER \\\\
router.post("/:id/filters", DashboardController.addFilterToDashboard);
router.put(
  "/:id/filters/:filterId",
  DashboardController.updateFilterOnDashboard
);
router.delete(
  "/:id/filters/:filterId",
  DashboardController.deleteFilterFromDashboard
);
// connect filter to chart
router.put(
  "/:id/questions/:instanceId/mappings",
  DashboardController.updateFilterMappings
);

module.exports = router;
