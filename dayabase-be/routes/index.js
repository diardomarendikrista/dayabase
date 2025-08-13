// routes/index.js
const express = require("express");
const router = express.Router();

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const Controller = require("../controllers");
router.get("/", Controller.getRootHandler);

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const accountRoutes = require("./accountRoutes");

const queryRoutes = require("./queryRoutes");
const questionRoutes = require("./questionRoutes");
const connectionRoutes = require("./connectionRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const publicRoutes = require("./publicRoutes");

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);

router.use("/users", verifyToken, isAdmin, userRoutes); // Hanya admin

router.use('/account', verifyToken, accountRoutes);
router.use("/questions", verifyToken, questionRoutes);
router.use("/dashboards", verifyToken, dashboardRoutes);
router.use("/connections", verifyToken, connectionRoutes);
router.use("/query", verifyToken, queryRoutes);

module.exports = router;
