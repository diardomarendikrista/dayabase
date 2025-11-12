const express = require("express");
const router = express.Router();

const PublicController = require("../controllers/publicController");

router.get("/dashboards/:token", PublicController.getPublicDashboardByToken);
// router.post("/query/run/:token", PublicController.runPublicQuery);

module.exports = router;
