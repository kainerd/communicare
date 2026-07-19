const { createPatient, findByCaregiver, findById, updatePatient } = require('../models/patientModel');
const { pool } = require('../config/db');

const VALID_GENDERS = ['male', 'female', 'other'];

// The `gender` column is a MySQL ENUM; an out-of-range value throws a raw
// SQL error that the generic error handler turns into an unhelpful
// "Internal server error" instead of a clear validation message. The
// dropdown UI already only offers these three options, but the API itself
// had no guard, so a direct/malformed request could still trip this.
function isValidGender(gender) {
  return gender === undefined || gender === null || gender === '' || VALID_GENDERS.includes(gender);
}

async function listPatients(req, res, next) {
  try {
    const patients = await findByCaregiver(req.dbUser.id);
    res.json({ patients });
  } catch (err) { next(err); }
}

async function createPatientHandler(req, res, next) {
  try {
    const { full_name, age, gender, medical_notes } = req.body;
    if (!full_name) return res.status(400).json({ error: 'full_name is required' });
    if (!isValidGender(gender)) {
      return res.status(400).json({ error: `gender must be one of: ${VALID_GENDERS.join(', ')}` });
    }

    const id = await createPatient({
      fullName: full_name,
      age,
      gender,
      caregiverId: req.dbUser.id,
      medicalNotes: medical_notes,
    });
    const patient = await findById(id);
    res.status(201).json({ patient });
  } catch (err) { next(err); }
}

async function getPatient(req, res, next) {
  try {
    const patient = await findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.caregiver_id !== req.dbUser.id && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ patient });
  } catch (err) { next(err); }
}

async function updatePatientHandler(req, res, next) {
  try {
    const patient = await findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.caregiver_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { full_name, age, gender, medical_notes } = req.body;
    if (!isValidGender(gender)) {
      return res.status(400).json({ error: `gender must be one of: ${VALID_GENDERS.join(', ')}` });
    }
    await updatePatient(req.params.id, {
      fullName: full_name || patient.full_name,
      age: age !== undefined ? age : patient.age,
      gender: gender !== undefined ? gender : patient.gender,
      medicalNotes: medical_notes !== undefined ? medical_notes : patient.medical_notes,
    });
    const updated = await findById(req.params.id);
    res.json({ patient: updated });
  } catch (err) { next(err); }
}

/**
 * DELETE /api/patients/:id
 * Permanently removes a patient and all their data.
 *
 * Cascade chain (all ON DELETE CASCADE in schema):
 *   patients → visits → board_selections
 *                     → caregiver_speech_logs
 *                     → ai_summaries
 *
 * Permission: only the owning caregiver can delete.
 * Admin is intentionally excluded — admins have read-only access to clinical data per spec.
 */
async function deletePatient(req, res, next) {
  try {
    const patient = await findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Only the assigned caregiver may delete
    if (patient.caregiver_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Access denied — only the assigned caregiver can delete this patient.' });
    }

    // Count visits so the response can confirm what was removed
    const [[{ visitCount }]] = await pool.query(
      'SELECT COUNT(*) AS visitCount FROM visits WHERE patient_id = ?',
      [req.params.id],
    );

    // WHERE id = ? — deletes exactly one patient row by primary key; parameterized, no injection risk
    // FK cascades handle all child rows automatically
    await pool.query('DELETE FROM patients WHERE id = ?', [req.params.id]);

    res.json({
      message: `Patient "${patient.full_name}" and ${visitCount} associated consultation(s) permanently deleted.`,
      deletedPatientId: Number(req.params.id),
      visitCount: Number(visitCount),
    });
  } catch (err) { next(err); }
}

async function getPatientReport(req, res, next) {
  try {
    const patient = await findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.caregiver_id !== req.dbUser.id && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [visits] = await pool.query(
      `SELECT v.*, u.name AS caregiver_name
       FROM visits v JOIN users u ON u.id = v.caregiver_id
       WHERE v.patient_id = ? ORDER BY v.visit_date ASC`,
      [patient.id],
    );

    const enriched = await Promise.all(visits.map(async (v) => {
      const [board] = await pool.query(
        'SELECT category, label FROM board_selections WHERE visit_id = ? ORDER BY created_at ASC',
        [v.id],
      );
      const [speech] = await pool.query(
        'SELECT transcript_text, created_at FROM caregiver_speech_logs WHERE visit_id = ? ORDER BY created_at ASC',
        [v.id],
      );
      const [summaryRows] = await pool.query(
        'SELECT summary_text, generated_at FROM ai_summaries WHERE visit_id = ? ORDER BY generated_at DESC LIMIT 1',
        [v.id],
      );
      return {
        ...v,
        board_selections: board,
        speech_logs: speech,
        ai_summary: summaryRows[0] || null,
      };
    }));

    res.json({ patient, visits: enriched });
  } catch (err) { next(err); }
}

module.exports = {
  listPatients, createPatientHandler, getPatient,
  updatePatientHandler, deletePatient, getPatientReport,
};
