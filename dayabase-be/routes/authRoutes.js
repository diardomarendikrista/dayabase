const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");

router.get("/setup-status", AuthController.getSetupStatus);
router.post("/register-first-admin", AuthController.registerFirstAdmin);
router.post("/login", AuthController.login);

module.exports = router;
