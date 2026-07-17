const { pool } = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, status, created_at FROM users WHERE id = ?',
    [id],
  );
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash, role = 'caregiver' }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    [name, email, passwordHash, role, 'active'],
  );
  return result.insertId;
}

async function getAllCaregivers() {
  const [rows] = await pool.query(
    "SELECT id, name, email, status, created_at FROM users WHERE role = 'caregiver' ORDER BY created_at DESC",
  );
  return rows;
}

async function setStatus(id, status) {
  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}

async function updateUser(id, fields) {
  // fields: { name, email } — only defined keys are updated
  const sets = [];
  const vals = [];
  if (fields.name  !== undefined) { sets.push('name = ?');  vals.push(fields.name); }
  if (fields.email !== undefined) { sets.push('email = ?'); vals.push(fields.email); }
  if (sets.length === 0) return;
  vals.push(id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
}

// Return the full row including password_hash (needed for bcrypt.compare)
async function findByIdFull(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

module.exports = {
  findByEmail, findById, findByIdFull,
  createUser, getAllCaregivers,
  setStatus, updatePassword, updateUser,
};
