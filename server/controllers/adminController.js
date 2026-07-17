const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { getAllCaregivers, setStatus, updatePassword, updateUser, findById, findByEmail } = require('../models/userModel');

// ── Caregivers ───────────────────────────────────────────────────────────────

async function listCaregivers(req, res, next) {
  try {
    const caregivers = await getAllCaregivers();
    res.json({ caregivers });
  } catch (err) { next(err); }
}

async function setCaregiverStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: 'status must be "active" or "disabled"' });
    }

    const user = await findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'caregiver') return res.status(400).json({ error: 'Can only change status of caregivers' });

    await setStatus(id, status);
    res.json({ message: `Account ${status === 'active' ? 'enabled' : 'disabled'}` });
  } catch (err) { next(err); }
}

async function resetCaregiverPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'new_password must be at least 6 characters' });
    }

    const user = await findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'caregiver') return res.status(400).json({ error: 'Can only reset caregiver passwords' });

    const hash = await bcrypt.hash(new_password, 12);
    await updatePassword(id, hash);
    res.json({ message: 'Password reset successfully' });
  } catch (err) { next(err); }
}

// ── Patients (read-only) ─────────────────────────────────────────────────────

async function listAllPatients(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.name AS caregiver_name,
         (SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id) AS visit_count
       FROM patients p
       JOIN users u ON u.id = p.caregiver_id
       ORDER BY p.created_at DESC`,
    );
    res.json({ patients: rows });
  } catch (err) { next(err); }
}

// ── Visits (read-only) ───────────────────────────────────────────────────────

async function listAllVisits(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT v.*, 
         p.full_name AS patient_name,
         u.name AS caregiver_name
       FROM visits v
       JOIN patients p ON p.id = v.patient_id
       JOIN users    u ON u.id = v.caregiver_id
       ORDER BY v.visit_date DESC
       LIMIT 200`,
    );
    res.json({ visits: rows });
  } catch (err) { next(err); }
}

/**
 * PUT /api/admin/caregivers/:id
 * Admin updates a caregiver's name, email, and/or resets their password.
 * No current-password confirmation required.
 */
async function updateCaregiver(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, new_password } = req.body;

    if (!name && !email && !new_password) {
      return res.status(400).json({ error: 'Provide at least one field: name, email, or new_password' });
    }

    const user = await findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'caregiver') return res.status(400).json({ error: 'Can only edit caregivers' });

    // Email uniqueness check
    if (email && email !== user.email) {
      const existing = await findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email already in use' });
    }

    const fields = {};
    if (name)  fields.name  = name;
    if (email) fields.email = email;
    if (Object.keys(fields).length) await updateUser(id, fields);

    if (new_password) {
      if (new_password.length < 6) return res.status(400).json({ error: 'new_password must be at least 6 characters' });
      const hash = await bcrypt.hash(new_password, 12);
      await updatePassword(id, hash);
    }

    const updated = await findById(id);
    res.json({ user: updated, message: 'Caregiver updated successfully' });
  } catch (err) { next(err); }
}

module.exports = {
  listCaregivers, setCaregiverStatus, resetCaregiverPassword,
  updateCaregiver,
  listAllPatients, listAllVisits,
};
