const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getSelections, saveSelections, clearSelections, deleteSelection } = require('../controllers/boardController');

const guard      = [authenticate, requireRole('caregiver', 'admin')];
const caregivers = [authenticate, requireRole('caregiver')];

router.get('/visit/:visitId',                              ...guard,      getSelections);
router.post('/visit/:visitId',                             ...caregivers, saveSelections);
router.delete('/visit/:visitId',                           ...caregivers, clearSelections);         // clear all
router.delete('/visit/:visitId/selection/:selId',          ...caregivers, deleteSelection);         // single entry

module.exports = router;
