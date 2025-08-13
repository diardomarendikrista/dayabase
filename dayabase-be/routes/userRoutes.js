const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");

router.post("/", UserController.createUser);
router.get("/", UserController.getAllUsers);
router.put("/:id", UserController.updateUser);
router.delete("/:id", UserController.deleteUser);

module.exports = router;
