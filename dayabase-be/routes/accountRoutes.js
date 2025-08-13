const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

router.put('/change-password', UserController.changePassword);

module.exports = router;