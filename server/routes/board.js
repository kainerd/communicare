const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getSelections, saveSelections, clearSelections } = require('../controllers/boardController');

const guard = [authenticate, requireRole('caregiver', 'admin')];

router.get('/visit/:visitId',    ...guard, getSelections);
router.post('/visit/:visitId',   ...guard, saveSelections);
router.delete('/visit/:visitId', ...guard, clearSelections);

module.exports = router;
