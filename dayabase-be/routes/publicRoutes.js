const express = require("express");
const router = express.Router();

const PublicController = require("../controllers/publicController");

router.get("/dashboards/:token", PublicController.getPublicDashboardByToken);

module.exports = router;
