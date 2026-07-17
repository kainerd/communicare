const { pool } = require('../config/db');
const { findById: findVisit } = require('../models/visitModel');

async function getLogs(req, res, next) {
  try {
    const { visitId } = req.params;
    const visit = await findVisit(visitId);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    const [rows] = await pool.query(
      'SELECT * FROM caregiver_speech_logs WHERE visit_id = ? ORDER BY created_at ASC',
      [visitId],
    );
    res.json({ logs: rows });
  } catch (err) { next(err); }
}

async function saveLog(req, res, next) {
  try {
    const { visitId } = req.params;
    const { transcript_text } = req.body;

    if (!transcript_text || !transcript_text.trim()) {
      return res.status(400).json({ error: 'transcript_text is required' });
    }

    const visit = await findVisit(visitId);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    if (visit.status === 'closed') return res.status(400).json({ error: 'Visit is closed' });

    const [result] = await pool.query(
      'INSERT INTO caregiver_speech_logs (visit_id, transcript_text) VALUES (?, ?)',
      [visitId, transcript_text.trim()],
    );

    const [rows] = await pool.query(
      'SELECT * FROM caregiver_speech_logs WHERE id = ?',
      [result.insertId],
    );
    res.status(201).json({ log: rows[0] });
  } catch (err) { next(err); }
}

module.exports = { getLogs, saveLog };
