const { createPatient, findByCaregiver, findById, updatePatient } = require('../models/patientModel');
const { pool } = require('../config/db');

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

async function getPatientReport(req, res, next) {
  try {
    const patient = await findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.caregiver_id !== req.dbUser.id && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // All visits for this patient
    const [visits] = await pool.query(
      `SELECT v.*, u.name AS caregiver_name
       FROM visits v JOIN users u ON u.id = v.caregiver_id
       WHERE v.patient_id = ? ORDER BY v.visit_date ASC`,
      [patient.id],
    );

    // Enrich each visit with its board selections, speech logs, and AI summary
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

module.exports = { listPatients, createPatientHandler, getPatient, updatePatientHandler, getPatientReport };
