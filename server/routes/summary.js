const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getSummary, generateSummary } = require('../controllers/summaryController');

const guard = [authenticate, requireRole('caregiver', 'admin')];

router.get('/visit/:visitId',  ...guard, getSummary);
router.post('/visit/:visitId', ...guard, generateSummary);

module.exports = router;
