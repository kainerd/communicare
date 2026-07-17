const { pool } = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, status,
            is_approved, is_verified, created_at
     FROM users WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

// Returns the full row including password_hash + token columns
async function findByIdFull(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByVerificationToken(token) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE verification_token = ?',
    [token],
  );
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash, role = 'caregiver' }) {
  // New caregivers start unapproved + unverified
  // Admins (seeded manually) are inserted with is_approved=1, is_verified=1 directly
  const [result] = await pool.query(
    `INSERT INTO users
       (name, email, password_hash, role, status, is_approved, is_verified)
     VALUES (?, ?, ?, ?, 'active', 0, 0)`,
    [name, email, passwordHash, role],
  );
  return result.insertId;
}

async function getAllCaregivers() {
  const [rows] = await pool.query(
    `SELECT id, name, email, status, is_approved, is_verified, created_at
     FROM users WHERE role = 'caregiver' ORDER BY created_at DESC`,
  );
  return rows;
}

async function getPendingCaregivers() {
  const [rows] = await pool.query(
    `SELECT id, name, email, status, is_approved, is_verified, created_at
     FROM users
     WHERE role = 'caregiver' AND is_approved = 0 AND status = 'active'
     ORDER BY created_at ASC`,
  );
  return rows;
}

async function setApproved(id) {
  await pool.query('UPDATE users SET is_approved = 1 WHERE id = ?', [id]);
}

async function setVerified(id) {
  await pool.query(
    'UPDATE users SET is_verified = 1, verification_token = NULL, verification_token_expires_at = NULL WHERE id = ?',
    [id],
  );
}

async function setVerificationToken(id, token, expiresAt) {
  await pool.query(
    'UPDATE users SET verification_token = ?, verification_token_expires_at = ? WHERE id = ?',
    [token, expiresAt, id],
  );
}

async function setStatus(id, status) {
  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}

async function updateUser(id, fields) {
  const sets = [];
  const vals = [];
  if (fields.name  !== undefined) { sets.push('name = ?');  vals.push(fields.name); }
  if (fields.email !== undefined) { sets.push('email = ?'); vals.push(fields.email); }
  if (sets.length === 0) return;
  vals.push(id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
}

module.exports = {
  findByEmail, findById, findByIdFull, findByVerificationToken,
  createUser, getAllCaregivers, getPendingCaregivers,
  setApproved, setVerified, setVerificationToken,
  setStatus, updatePassword, updateUser,
};
