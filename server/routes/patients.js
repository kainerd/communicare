const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  listPatients, createPatientHandler, getPatient,
  updatePatientHandler, deletePatient, getPatientReport,
} = require('../controllers/patientController');

const guard      = [authenticate, requireRole('caregiver', 'admin')];
const caregivers = [authenticate, requireRole('caregiver')];

router.get('/',             ...guard,      listPatients);
router.post('/',            ...caregivers, createPatientHandler);
router.get('/:id/report',   ...guard,      getPatientReport);
router.get('/:id',          ...guard,      getPatient);
router.put('/:id',          ...caregivers, updatePatientHandler);
router.delete('/:id',       ...caregivers, deletePatient);     // caregiver-only, admin excluded by spec

module.exports = router;
