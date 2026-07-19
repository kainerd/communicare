/**
 * Migration: widen board_selections.label from VARCHAR(100) to VARCHAR(500).
 *
 * Bug: the free-text board entry UI (VisitSession.jsx) allows up to 500
 * characters (maxLength={500}), but the column was only VARCHAR(100), so
 * saving anything over 100 characters either silently truncated the
 * patient's message or errored outright (depending on SQL strict mode) —
 * data loss for exactly the patients this app is built for. This brings
 * the column in line with the UI's already-declared 500-char limit.
 *
 * Safe to re-run.
 * Usage: node config/fixLabelLength.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'communicare',
  });

  await db.query('ALTER TABLE board_selections MODIFY COLUMN label VARCHAR(500) NOT NULL');
  console.log('board_selections.label widened to VARCHAR(500) ✓');

  await db.end();
}

run().catch((e) => { console.error('Fix failed:', e.message); process.exit(1); });
