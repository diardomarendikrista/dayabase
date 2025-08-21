const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/setup-status", AuthController.getSetupStatus);
router.post("/register-first-admin", AuthController.registerFirstAdmin);
router.post("/login", AuthController.login);
router.get("/me", verifyToken, AuthController.getMe);

module.exports = router;
