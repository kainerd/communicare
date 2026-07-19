const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  listCaregivers, listPendingCaregivers,
  approveCaregiver, rejectCaregiver,
  setCaregiverStatus, resetCaregiverPassword, updateCaregiver,
  deleteCaregiver, reassignPatient,
  listAllPatients, listAllVisits,
} = require('../controllers/adminController');

const adminOnly = [authMiddleware, roleMiddleware('admin')];

// ── Caregiver management ──────────────────────────────────────────────────────
router.get('/caregivers',                       ...adminOnly, listCaregivers);
router.get('/caregivers/pending',               ...adminOnly, listPendingCaregivers);
router.patch('/caregivers/:id/approve',         ...adminOnly, approveCaregiver);
router.patch('/caregivers/:id/reject',          ...adminOnly, rejectCaregiver);
router.put('/caregivers/:id',                   ...adminOnly, updateCaregiver);
router.patch('/caregivers/:id/status',          ...adminOnly, setCaregiverStatus);
router.patch('/caregivers/:id/reset-password',  ...adminOnly, resetCaregiverPassword);
router.delete('/caregivers/:id',                ...adminOnly, deleteCaregiver);

// ── Read-only views ───────────────────────────────────────────────────────────
router.get('/patients', ...adminOnly, listAllPatients);
router.get('/visits',   ...adminOnly, listAllVisits);
router.patch('/patients/:id/reassign', ...adminOnly, reassignPatient);

// Role-proof test route
router.get('/ping', ...adminOnly, (req, res) => {
  res.json({ message: `Admin route OK — hello ${req.dbUser.name}`, role: req.dbUser.role });
});

module.exports = router;
