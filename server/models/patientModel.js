const { pool } = require('../config/db');

async function createPatient({ userId, fullName, age, gender, caregiverId, medicalNotes }) {
  const [result] = await pool.query(
    `INSERT INTO patients (user_id, full_name, age, gender, caregiver_id, medical_notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId || null, fullName, age || null, gender || null, caregiverId, medicalNotes || null],
  );
  return result.insertId;
}

async function findByCaregiver(caregiverId) {
  const [rows] = await pool.query(
    `SELECT p.*, 
       (SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id) AS visit_count
     FROM patients p
     WHERE p.caregiver_id = ?
     ORDER BY p.created_at DESC`,
    [caregiverId],
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [id]);
  return rows[0] || null;
}

async function updatePatient(id, { fullName, age, gender, medicalNotes }) {
  await pool.query(
    `UPDATE patients SET full_name = ?, age = ?, gender = ?, medical_notes = ? WHERE id = ?`,
    [fullName, age || null, gender || null, medicalNotes || null, id],
  );
}

async function reassignCaregiver(patientId, caregiverId) {
  await pool.query('UPDATE patients SET caregiver_id = ? WHERE id = ?', [caregiverId, patientId]);
}

module.exports = { createPatient, findByCaregiver, findById, updatePatient, reassignCaregiver };
