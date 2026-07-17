const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  findByEmail, findById, findByIdFull, findByVerificationToken,
  createUser, setVerified, setVerificationToken,
} = require('../models/userModel');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await findByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    await createUser({ name, email, passwordHash, role: 'caregiver' });

    // No JWT issued — account must be approved + verified first
    res.status(201).json({
      message: 'Registration received. Your account is pending admin approval. You will receive a verification email once approved.',
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Check status first
    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Account has been disabled. Contact an administrator.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ error: 'Your registration was not approved.' });
    }

    // Verify password before revealing approval/verification state
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Approval gate (caregivers only — admin is always approved)
    if (user.role === 'caregiver' && !user.is_approved) {
      return res.status(403).json({ error: 'Your account is pending admin approval.' });
    }

    // Email verification gate
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email address before logging in. Check your inbox for the verification link.' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/verify?token=xxx ────────────────────────────────────────────
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Verification token is required' });

    const user = await findByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or already-used verification token' });
    }

    // Check expiry
    if (new Date() > new Date(user.verification_token_expires_at)) {
      return res.status(400).json({ error: 'Verification link has expired. Ask your admin to resend it.' });
    }

    await setVerified(user.id);

    res.json({ message: 'Email verified successfully. You can now log in.', email: user.email });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
async function me(req, res) {
  res.json({ user: req.dbUser });
}

module.exports = { register, login, verifyEmail, me };
