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
    // Security: prevent writing to another caregiver's visit
    if (visit.caregiver_id !== req.dbUser.id) return res.status(403).json({ error: 'Access denied' });

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

/**
 * DELETE /api/speech/visit/:visitId/log/:logId
 * Remove a single saved speech log entry.
 * Ownership is verified by joining to visits.
 */
async function deleteLog(req, res, next) {
  try {
    const { visitId, logId } = req.params;

    // JOIN to visits to verify ownership in one query
    const [rows] = await pool.query(
      `SELECT csl.id, v.caregiver_id
       FROM caregiver_speech_logs csl
       JOIN visits v ON v.id = csl.visit_id
       WHERE csl.id = ? AND csl.visit_id = ?`,
      [logId, visitId],
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Log entry not found' });
    if (rows[0].caregiver_id !== req.dbUser.id) return res.status(403).json({ error: 'Access denied' });

    // WHERE csl.id = ? — deletes exactly one row by primary key; parameterized
    await pool.query('DELETE FROM caregiver_speech_logs WHERE id = ?', [logId]);
    res.json({ message: 'Log deleted' });
  } catch (err) { next(err); }
}

module.exports = { getLogs, saveLog, deleteLog };
