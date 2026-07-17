const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public
router.post('/register', register);
router.post('/login', login);

// Protected — any authenticated user can fetch their own profile
router.get('/me', authenticate, requireRole('caregiver', 'admin'), me);

module.exports = router;
