/**
 * Migration: add approval + email-verification columns to users table.
 * Safe to re-run — checks INFORMATION_SCHEMA before each ADD COLUMN.
 * Usage: node config/migrateApproval.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function columnExists(db, dbName, table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, table, column],
  );
  return rows[0].n > 0;
}

async function run() {
  const dbName = process.env.DB_NAME || 'communicare';
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
  });

  // 1. Extend status ENUM to include 'rejected'
  await db.query(`
    ALTER TABLE users
    MODIFY COLUMN status ENUM('active','disabled','rejected') NOT NULL DEFAULT 'active'
  `);
  console.log("status ENUM extended to include 'rejected' ✓");

  // 2–5. Add columns only if they don't already exist
  const cols = [
    { name: 'is_approved',                  def: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'is_verified',                   def: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'verification_token',            def: 'VARCHAR(128) NULL' },
    { name: 'verification_token_expires_at', def: 'DATETIME NULL' },
  ];

  // Track whether this is a genuinely fresh migration (columns didn't exist
  // before this run) vs. a re-run on an already-migrated DB. This matters
  // for the backfill step below.
  let anyColumnWasNew = false;

  for (const col of cols) {
    if (await columnExists(db, dbName, 'users', col.name)) {
      console.log(`${col.name} already exists — skipped`);
    } else {
      await db.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
      console.log(`${col.name} column added ✓`);
      anyColumnWasNew = true;
    }
  }

  // 6. Backfill users that existed BEFORE the approval workflow was introduced
  // (grandfather them in as approved+verified, since they predate the concept).
  //
  // IMPORTANT: only run this on the FIRST migration (when the columns were
  // just added). On a re-run against an already-migrated DB, the columns
  // already exist and any is_approved=0 rows are genuinely pending caregiver
  // registrations awaiting admin review — backfilling them here would
  // silently bypass the entire approval workflow. This guard is what makes
  // re-running this script actually safe, as the file's docblock claims.
  if (anyColumnWasNew) {
    await db.query(`UPDATE users SET is_approved = 1, is_verified = 1 WHERE is_approved = 0`);
    const [updated] = await db.query('SELECT ROW_COUNT() AS n');
    console.log(`Backfilled ${updated[0].n} pre-existing user(s) to is_approved=1, is_verified=1 ✓`);
  } else {
    console.log('Columns already existed — skipping backfill (would incorrectly auto-approve any genuinely pending caregivers).');
  }

  await db.end();
  console.log('\n✓ Approval migration complete.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
