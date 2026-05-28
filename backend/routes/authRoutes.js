const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// This explicitly points to /register and /login
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;