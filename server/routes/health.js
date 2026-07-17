const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    app: 'CommuniCare',
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});

module.exports = router;
