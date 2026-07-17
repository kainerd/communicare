const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { startVisit, listVisits, getVisit, closeVisitHandler } = require('../controllers/visitController');

const guard = [authenticate, requireRole('caregiver', 'admin')];

router.post('/',                          ...guard, startVisit);
router.get('/patient/:patientId',         ...guard, listVisits);
router.get('/:id',                        ...guard, getVisit);
router.patch('/:id/close',               ...guard, closeVisitHandler);

module.exports = router;
