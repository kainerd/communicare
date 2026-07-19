const { createVisit, findByPatient, findById, closeVisit, findOpenVisit } = require('../models/visitModel');
const { findById: findPatient } = require('../models/patientModel');
const { pool } = require('../config/db');

async function startVisit(req, res, next) {
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    const patient = await findPatient(patient_id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.caregiver_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Enforce one active (open) visit per patient at a time. Without this,
    // a double-click, a second browser tab, or a slow network retry can
    // create two simultaneous "open" visits for the same patient — the UI
    // (which assumes a single active session) then shows only one of them
    // via "Resume Visit" while the other becomes an orphaned open visit
    // that's confusing to find in history. If one is already open, hand
    // that same visit back instead of creating a duplicate.
    const existingOpen = await findOpenVisit(patient_id);
    if (existingOpen) {
      const visit = await findById(existingOpen.id);
      return res.status(200).json({ visit, reused: true });
    }

    const id = await createVisit(patient_id, req.dbUser.id, req.body.visit_date);
    const visit = await findById(id);
    res.status(201).json({ visit });
  } catch (err) { next(err); }
}

// Returns visits enriched with board_count, speech_count, has_summary, summary_preview
async function listVisits(req, res, next) {
  try {
    const patient = await findPatient(req.params.patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.caregiver_id !== req.dbUser.id && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [visits] = await pool.query(
      `SELECT
         v.*,
         u.name AS caregiver_name,
         COUNT(DISTINCT bs.id)  AS board_count,
         COUNT(DISTINCT csl.id) AS speech_count,
         MAX(IF(ais.id IS NOT NULL, 1, 0)) AS has_summary,
         (SELECT LEFT(ais2.summary_text, 140)
          FROM ai_summaries ais2
          WHERE ais2.visit_id = v.id
          ORDER BY ais2.generated_at DESC LIMIT 1) AS summary_preview
       FROM visits v
       LEFT JOIN users u ON u.id = v.caregiver_id
       LEFT JOIN board_selections bs  ON bs.visit_id  = v.id
       LEFT JOIN caregiver_speech_logs csl ON csl.visit_id = v.id
       LEFT JOIN ai_summaries ais ON ais.visit_id = v.id
       WHERE v.patient_id = ?
       GROUP BY v.id
       ORDER BY v.visit_date DESC`,
      [req.params.patientId],
    );

    res.json({ visits });
  } catch (err) { next(err); }
}

async function getVisit(req, res, next) {
  try {
    const visit = await findById(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    res.json({ visit });
  } catch (err) { next(err); }
}

async function closeVisitHandler(req, res, next) {
  try {
    const visit = await findById(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    if (visit.caregiver_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await closeVisit(req.params.id);
    const updated = await findById(req.params.id);
    res.json({ message: 'Visit closed', visit: updated });
  } catch (err) { next(err); }
}

// DELETE /api/visits/:id/data — wipes board, speech, summaries but keeps visit open
async function clearVisitData(req, res, next) {
  try {
    const visit = await findById(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    if (visit.caregiver_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (visit.status !== 'open') {
      return res.status(400).json({ error: 'Cannot clear data on a closed visit.' });
    }

    await pool.query('DELETE FROM board_selections  WHERE visit_id = ?', [req.params.id]);
    await pool.query('DELETE FROM caregiver_speech_logs WHERE visit_id = ?', [req.params.id]);
    await pool.query('DELETE FROM ai_summaries       WHERE visit_id = ?', [req.params.id]);

    res.json({ message: 'Visit data cleared.' });
  } catch (err) { next(err); }
}

// DELETE /api/visits/:id — permanently removes visit + all related data
async function deleteVisit(req, res, next) {
  try {
    const visit = await findById(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    const isOwner   = visit.caregiver_id === req.dbUser.id;
    const isAdmin   = req.dbUser.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Access denied' });

    // Cascade deletes: board_selections, speech_logs, ai_summaries all ON DELETE CASCADE
    await pool.query('DELETE FROM visits WHERE id = ?', [req.params.id]);
    res.json({ message: 'Visit deleted.' });
  } catch (err) { next(err); }
}

module.exports = { startVisit, listVisits, getVisit, closeVisitHandler, clearVisitData, deleteVisit };
