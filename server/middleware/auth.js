const jwt = require('jsonwebtoken');
const { findById } = require('../models/userModel');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const user = await findById(req.user.id);
      if (!user) return res.status(401).json({ error: 'User not found' });
      if (user.status === 'disabled') return res.status(403).json({ error: 'Account disabled' });
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      req.dbUser = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Aliases matching PROJECT.md naming convention
const authMiddleware = authenticate;
const roleMiddleware = (...roles) => requireRole(...roles);

module.exports = { authenticate, requireRole, authMiddleware, roleMiddleware };
