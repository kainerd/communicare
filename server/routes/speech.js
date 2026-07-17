const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getLogs, saveLog } = require('../controllers/speechController');

const guard = [authenticate, requireRole('caregiver', 'admin')];

router.get('/visit/:visitId',  ...guard, getLogs);
router.post('/visit/:visitId', ...guard, saveLog);

module.exports = router;
