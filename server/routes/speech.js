const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getLogs, saveLog, deleteLog } = require('../controllers/speechController');

const guard      = [authenticate, requireRole('caregiver', 'admin')];
const caregivers = [authenticate, requireRole('caregiver')];

router.get('/visit/:visitId',                       ...guard,      getLogs);
router.post('/visit/:visitId',                      ...caregivers, saveLog);
router.delete('/visit/:visitId/log/:logId',         ...caregivers, deleteLog);    // single entry

module.exports = router;
