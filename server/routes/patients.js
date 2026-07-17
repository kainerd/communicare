const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  listPatients, createPatientHandler, getPatient, updatePatientHandler, getPatientReport,
} = require('../controllers/patientController');

const guard = [authenticate, requireRole('caregiver', 'admin')];

router.get('/',            ...guard, listPatients);
router.post('/',           ...guard, createPatientHandler);
router.get('/:id/report',  ...guard, getPatientReport);
router.get('/:id',         ...guard, getPatient);
router.put('/:id',         ...guard, updatePatientHandler);

module.exports = router;
