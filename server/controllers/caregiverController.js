const bcrypt = require('bcryptjs');
const { findByIdFull, updateUser, updatePassword, findByEmail } = require('../models/userModel');

/**
 * PUT /api/caregiver/me
 * Caregiver updates their own name, email, and/or password.
 * Password change requires current_password confirmation.
 */
async function updateMe(req, res, next) {
  try {
    const { name, email, current_password, new_password } = req.body;

    if (!name && !email && !new_password) {
      return res.status(400).json({ error: 'Provide at least one field to update: name, email, or new_password' });
    }

    const user = await findByIdFull(req.dbUser.id);

    // Email uniqueness check
    if (email && email !== user.email) {
      const existing = await findByEmail(email);
      if (existing) return res.status(409).json({ error: 'Email already in use' });
    }

    // If changing password, require current password first
    if (new_password !== undefined) {
      if (!current_password) {
        return res.status(400).json({ error: 'current_password is required to set a new password' });
      }
      const match = await bcrypt.compare(current_password, user.password_hash);
      if (!match) return res.status(401).json({ error: 'current_password is incorrect' });
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'new_password must be at least 6 characters' });
      }
      const hash = await bcrypt.hash(new_password, 12);
      await updatePassword(user.id, hash);
    }

    // Update name / email
    const updates = {};
    if (name)  updates.name  = name;
    if (email) updates.email = email;
    if (Object.keys(updates).length) await updateUser(user.id, updates);

    // Return updated profile (no password_hash)
    const { password_hash, ...safe } = await findByIdFull(user.id);
    res.json({ user: safe, message: 'Profile updated successfully' });
  } catch (err) { next(err); }
}

module.exports = { updateMe };
