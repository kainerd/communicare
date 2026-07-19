const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  startVisit, listVisits, getVisit,
  closeVisitHandler, clearVisitData, deleteVisit,
} = require('../controllers/visitController');

const guard      = [authenticate, requireRole('caregiver', 'admin')];
const caregivers = [authenticate, requireRole('caregiver')];

router.post('/',                       ...guard,      startVisit);
router.get('/patient/:patientId',      ...guard,      listVisits);
router.get('/:id',                     ...guard,      getVisit);
router.patch('/:id/close',             ...caregivers, closeVisitHandler);
router.delete('/:id/data',             ...caregivers, clearVisitData);   // clear session data
router.delete('/:id',                  ...guard,      deleteVisit);      // delete whole visit

module.exports = router;
