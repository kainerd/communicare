/**
 * Migration: add approval + email-verification columns to users table.
 * Safe to re-run — uses IF NOT EXISTS / MODIFY only when needed.
 * Usage: node config/migrateApproval.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // 1. Extend status ENUM to include 'rejected'
  await db.query(`
    ALTER TABLE users
    MODIFY COLUMN status ENUM('active','disabled','rejected') NOT NULL DEFAULT 'active'
  `);
  console.log("status ENUM extended to include 'rejected' ✓");

  // 2. Add is_approved (default false — new registrations start unapproved)
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_approved TINYINT(1) NOT NULL DEFAULT 0
  `);
  console.log('is_approved column added ✓');

  // 3. Add is_verified (default false)
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) NOT NULL DEFAULT 0
  `);
  console.log('is_verified column added ✓');

  // 4. Add verification_token (random hex token stored on approval)
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verification_token VARCHAR(128) NULL
  `);
  console.log('verification_token column added ✓');

  // 5. Add verification_token_expires_at
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verification_token_expires_at DATETIME NULL
  `);
  console.log('verification_token_expires_at column added ✓');

  // 6. Backfill existing users (admin + demo caregivers) as already approved + verified
  //    so existing accounts keep working without re-going through the flow.
  await db.query(`
    UPDATE users
    SET is_approved = 1, is_verified = 1
    WHERE is_approved = 0
  `);
  const [updated] = await db.query('SELECT ROW_COUNT() AS n');
  console.log(`Backfilled ${updated[0].n} existing user(s) to is_approved=1, is_verified=1 ✓`);

  await db.end();
  console.log('\n✓ Approval migration complete.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
