const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { updateMe } = require('../controllers/caregiverController');

// Caregiver-only guard using PROJECT.md naming
const caregiverOnly = [authMiddleware, roleMiddleware('caregiver')];

// Self-edit: name, email, password (requires current password for password change)
router.put('/me', ...caregiverOnly, updateMe);

// Test route — proves caregiver-only protection
router.get('/ping', ...caregiverOnly, (req, res) => {
  res.json({ message: `Caregiver route OK — hello ${req.dbUser.name}`, role: req.dbUser.role });
});

module.exports = router;
