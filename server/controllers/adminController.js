const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');
const {
  getAllCaregivers, getPendingCaregivers, setStatus,
  updatePassword, updateUser, findById, findByEmail,
  setApproved, setVerificationToken, deleteUser,
} = require('../models/userModel');
const { reassignCaregiver, findById: findPatient } = require('../models/patientModel');
const { sendVerificationEmail } = require('../utils/email');

// ── Caregivers ───────────────────────────────────────────────────────────────

async function listCaregivers(req, res, next) {
  try {
    const caregivers = await getAllCaregivers();
    res.json({ caregivers });
  } catch (err) { next(err); }
}

async function listPendingCaregivers(req, res, next) {
  try {
    const caregivers = await getPendingCaregivers();
    res.json({ caregivers });
  } catch (err) { next(err); }
}

async function approveCaregiver(req, res, next) {
  try {
    const { id } = req.params;
    const user = await findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'caregiver') return res.status(400).json({ error: 'Can only approve caregivers' });
    if (user.is_approved) return res.status(400).json({ error: 'Account is already approved' });

    // Mark as approved
    await setApproved(id);

    // Generate a 24-hour verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 h
    await setVerificationToken(id, token, expiresAt);

    // Send verification email
    await sendVerificationEmail(user.email, user.name, token);

    res.json({ message: `Caregiver approved. Verification email sent to ${user.email}.` });
  } catch (err) { next(err); }
}

async function rejectCaregiver(req, res, next) {
  try {
    const { id } = req.params;
    const user = await findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'caregiver') return res.status(400).json({ error: 'Can only reject caregivers' });

    await setStatus(id, 'rejected');
    res.json({ message: 'Caregiver registration rejected.' });
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

/**
 * DELETE /api/admin/caregivers/:id
 * Permanently deletes a caregiver's User account.
 *
 * Does NOT delete their patients or visit history — patients.caregiver_id
 * and visits.caregiver_id are ON DELETE SET NULL, so this unlinks them
 * instead (they become "Unassigned" and stay fully visible/reassignable
 * via listAllPatients / reassignPatient below). This is a deliberate
 * design choice per spec: user deletion must never destroy clinical data.
 */
async function deleteCaregiver(req, res, next) {
  try {
    const { id } = req.params;
    const user = await findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'caregiver') {
      return res.status(400).json({ error: 'Can only delete caregiver accounts' });
    }

    // Count what will be unlinked so the admin gets clear feedback
    const [[{ patientCount }]] = await pool.query(
      'SELECT COUNT(*) AS patientCount FROM patients WHERE caregiver_id = ?',
      [id],
    );

    // WHERE id = ? — deletes exactly one user row by primary key; parameterized
    await deleteUser(id);

    res.json({
      message: patientCount > 0
        ? `Caregiver "${user.name}" deleted. ${patientCount} patient(s) were unlinked and are now unassigned — reassign them from the Patients tab.`
        : `Caregiver "${user.name}" deleted.`,
      deletedUserId: Number(id),
      unassignedPatientCount: Number(patientCount),
    });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/admin/patients/:id/reassign
 * Body: { caregiver_id }
 * Moves a patient (typically one orphaned by deleteCaregiver) to a
 * different active caregiver.
 */
async function reassignPatient(req, res, next) {
  try {
    const { id } = req.params;
    const { caregiver_id } = req.body;
    if (!caregiver_id) return res.status(400).json({ error: 'caregiver_id is required' });

    const patient = await findPatient(id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const newCaregiver = await findById(caregiver_id);
    if (!newCaregiver || newCaregiver.role !== 'caregiver') {
      return res.status(400).json({ error: 'caregiver_id must belong to an existing caregiver account' });
    }
    if (newCaregiver.status !== 'active') {
      return res.status(400).json({ error: 'Cannot reassign to a disabled/rejected caregiver account' });
    }

    await reassignCaregiver(id, caregiver_id);
    res.json({ message: `Patient "${patient.full_name}" reassigned to ${newCaregiver.name}.` });
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
    // LEFT JOIN (not JOIN): a patient whose caregiver was deleted has
    // caregiver_id = NULL — an inner join would silently hide them from
    // this list, making an "unlinked" patient effectively invisible/lost.
    const [rows] = await pool.query(
      `SELECT p.*, u.name AS caregiver_name,
         (SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id) AS visit_count
       FROM patients p
       LEFT JOIN users u ON u.id = p.caregiver_id
       ORDER BY p.created_at DESC`,
    );
    res.json({ patients: rows });
  } catch (err) { next(err); }
}

// ── Visits (read-only) ───────────────────────────────────────────────────────

async function listAllVisits(req, res, next) {
  try {
    // LEFT JOIN users: a visit whose caregiver was deleted has
    // caregiver_id = NULL — must still show up (an inner join would hide it).
    const [rows] = await pool.query(
      `SELECT v.*, 
         p.full_name AS patient_name,
         u.name AS caregiver_name
       FROM visits v
       JOIN patients p ON p.id = v.patient_id
       LEFT JOIN users u ON u.id = v.caregiver_id
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
  listCaregivers, listPendingCaregivers,
  approveCaregiver, rejectCaregiver,
  setCaregiverStatus, resetCaregiverPassword, updateCaregiver,
  deleteCaregiver, reassignPatient,
  listAllPatients, listAllVisits,
};
