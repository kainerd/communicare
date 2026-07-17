const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, me } = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public
router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifyEmail);         // GET /api/auth/verify?token=xxx

// Protected
router.get('/me', authenticate, requireRole('caregiver', 'admin'), me);

module.exports = router;
