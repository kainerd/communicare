/**
 * Run once to create the database, all tables, and seed the admin account.
 * Usage: node config/initDb.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const {
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
} = process.env;

async function init() {
  // Connect without a database first so we can create it
  const root = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
  });

  console.log('Connected to MySQL.');

  await root.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`Database '${DB_NAME}' ready.`);
  await root.query(`USE \`${DB_NAME}\``);

  // ── users ────────────────────────────────────────────────────────────────
  await root.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(150)  NOT NULL,
      email         VARCHAR(255)  NOT NULL UNIQUE,
      password_hash VARCHAR(255)  NOT NULL,
      role          ENUM('patient','caregiver','admin') NOT NULL DEFAULT 'caregiver',
      status        ENUM('active','disabled','rejected') NOT NULL DEFAULT 'active',
      is_approved   TINYINT(1) NOT NULL DEFAULT 0,
      is_verified   TINYINT(1) NOT NULL DEFAULT 0,
      verification_token            VARCHAR(128) NULL,
      verification_token_expires_at DATETIME NULL,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Table: users ✓');

  // ── patients ─────────────────────────────────────────────────────────────
  await root.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT          NULL,
      full_name     VARCHAR(150) NOT NULL,
      age           INT          NULL,
      gender        ENUM('male','female','other') NULL,
      caregiver_id  INT          NULL,
      medical_notes TEXT         NULL,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      -- SET NULL (not CASCADE): deleting a caregiver account must unlink
      -- their patients, not delete them — see fixUserDeleteFK.js.
      FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('Table: patients ✓');

  // ── visits ───────────────────────────────────────────────────────────────
  await root.query(`
    CREATE TABLE IF NOT EXISTS visits (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      patient_id   INT NOT NULL,
      caregiver_id INT NULL,
      visit_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status       ENUM('open','closed') NOT NULL DEFAULT 'open',
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id)   REFERENCES patients(id) ON DELETE CASCADE,
      -- SET NULL: a deleted caregiver's past visit history must stay intact
      FOREIGN KEY (caregiver_id) REFERENCES users(id)    ON DELETE SET NULL
    )
  `);
  console.log('Table: visits ✓');

  // ── board_selections ─────────────────────────────────────────────────────
  await root.query(`
    CREATE TABLE IF NOT EXISTS board_selections (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      visit_id   INT NOT NULL,
      category   ENUM('body_part','need','emotion','symptom','free_text') NOT NULL,
      label      VARCHAR(500) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
    )
  `);
  console.log('Table: board_selections ✓');

  // ── caregiver_speech_logs ────────────────────────────────────────────────
  await root.query(`
    CREATE TABLE IF NOT EXISTS caregiver_speech_logs (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      visit_id        INT  NOT NULL,
      transcript_text TEXT NOT NULL,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
    )
  `);
  console.log('Table: caregiver_speech_logs ✓');

  // ── ai_summaries ─────────────────────────────────────────────────────────
  await root.query(`
    CREATE TABLE IF NOT EXISTS ai_summaries (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      visit_id     INT  NOT NULL,
      summary_text TEXT NOT NULL,
      generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
    )
  `);
  console.log('Table: ai_summaries ✓');

  // ── Seed admin account ───────────────────────────────────────────────────
  const adminEmail = 'wadenerd6@gmail.com';
  const [existing] = await root.query('SELECT id FROM users WHERE email = ?', [adminEmail]);

  if (existing.length === 0) {
    const hash = await bcrypt.hash('Admin123', 12);
    // is_approved / is_verified explicitly set to 1 — admins are always
    // approved+verified and have no self-service flow to satisfy these
    // gates otherwise (see authController.login).
    await root.query(
      `INSERT INTO users (name, email, password_hash, role, status, is_approved, is_verified)
       VALUES (?, ?, ?, ?, ?, 1, 1)`,
      ['Admin', adminEmail, hash, 'admin', 'active'],
    );
    console.log('Admin account seeded ✓');
  } else {
    // Defensive: if an admin row somehow exists without these flags set
    // (e.g. inserted manually, or created before this fix), self-heal it.
    await root.query(
      `UPDATE users SET is_approved = 1, is_verified = 1
       WHERE email = ? AND (is_approved = 0 OR is_verified = 0)`,
      [adminEmail],
    );
    console.log('Admin account already exists — skipped (verified approval flags are set).');
  }

  await root.end();
  console.log('\n✓ Database initialisation complete.');
}

init().catch((err) => {
  console.error('Init failed:', err.message);
  process.exit(1);
});
