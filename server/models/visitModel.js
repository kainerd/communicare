const { pool } = require('../config/db');

async function createVisit(patientId, caregiverId) {
  const [result] = await pool.query(
    `INSERT INTO visits (patient_id, caregiver_id, status) VALUES (?, ?, 'open')`,
    [patientId, caregiverId],
  );
  return result.insertId;
}

async function findByPatient(patientId) {
  const [rows] = await pool.query(
    `SELECT v.*,
       u.name AS caregiver_name
     FROM visits v
     JOIN users u ON u.id = v.caregiver_id
     WHERE v.patient_id = ?
     ORDER BY v.visit_date DESC`,
    [patientId],
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT v.*, u.name AS caregiver_name, p.full_name AS patient_name
     FROM visits v
     JOIN users    u ON u.id = v.caregiver_id
     JOIN patients p ON p.id = v.patient_id
     WHERE v.id = ?`,
    [id],
  );
  return rows[0] || null;
}

async function closeVisit(id) {
  await pool.query(`UPDATE visits SET status = 'closed' WHERE id = ?`, [id]);
}

async function findOpenVisit(patientId) {
  const [rows] = await pool.query(
    `SELECT * FROM visits WHERE patient_id = ? AND status = 'open' ORDER BY visit_date DESC LIMIT 1`,
    [patientId],
  );
  return rows[0] || null;
}

module.exports = { createVisit, findByPatient, findById, closeVisit, findOpenVisit };
