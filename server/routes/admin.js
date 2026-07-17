const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  listCaregivers, setCaregiverStatus, resetCaregiverPassword,
  updateCaregiver,
  listAllPatients, listAllVisits,
} = require('../controllers/adminController');

// Admin-only guard using PROJECT.md naming
const adminOnly = [authMiddleware, roleMiddleware('admin')];

// ── Caregiver management ──────────────────────────────────────────────────────
router.get('/caregivers',                      ...adminOnly, listCaregivers);
router.put('/caregivers/:id',                  ...adminOnly, updateCaregiver);          // name, email, password reset
router.patch('/caregivers/:id/status',         ...adminOnly, setCaregiverStatus);       // enable / disable
router.patch('/caregivers/:id/reset-password', ...adminOnly, resetCaregiverPassword);   // kept for backward compat

// ── Read-only views ───────────────────────────────────────────────────────────
router.get('/patients', ...adminOnly, listAllPatients);
router.get('/visits',   ...adminOnly, listAllVisits);

// Test route — proves admin-only protection
router.get('/ping', ...adminOnly, (req, res) => {
  res.json({ message: `Admin route OK — hello ${req.dbUser.name}`, role: req.dbUser.role });
});

module.exports = router;
