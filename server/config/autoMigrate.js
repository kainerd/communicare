/**
 * autoMigrate — runs every time the server starts.
 *
 * Each step is fully idempotent: it checks the current schema first and
 * only alters it when needed. This makes the server self-healing in
 * production (Railway) where manual `node config/*.js` scripts can't
 * easily be run — a simple redeploy is enough to bring the DB up to date.
 *
 * Uses the shared `pool` from db.js so it automatically picks up the
 * correct connection string (MYSQL_URL on Railway, DB_* vars locally).
 */
const { pool } = require('./db');

// ── helpers ──────────────────────────────────────────────────────────────────

async function columnExists(table, column) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS n
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = ?
        AND COLUMN_NAME  = ?`,
    [table, column],
  );
  return row.n > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (await columnExists(table, column)) return false;
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`[migrate] ${table}.${column} added ✓`);
  return true;
}

async function getFKDeleteRule(constraintName) {
  const [rows] = await pool.query(
    `SELECT DELETE_RULE
       FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND CONSTRAINT_NAME   = ?`,
    [constraintName],
  );
  return rows[0]?.DELETE_RULE || null;
}

async function getColumnCharMax(table, column) {
  const [[row]] = await pool.query(
    `SELECT CHARACTER_MAXIMUM_LENGTH AS len
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = ?
        AND COLUMN_NAME  = ?`,
    [table, column],
  );
  return row?.len ?? null;
}

// ── migration steps ───────────────────────────────────────────────────────────

/**
 * Step 1 — approval/verification columns on users.
 * Missing columns = createUser INSERT fails → 500 on register.
 */
async function migrateApprovalColumns() {
  // Extend status ENUM to include 'rejected' (idempotent ALTER is safe in MySQL)
  await pool.query(`
    ALTER TABLE users
    MODIFY COLUMN status ENUM('active','disabled','rejected') NOT NULL DEFAULT 'active'
  `);

  let anyNew = false;
  anyNew |= await addColumnIfMissing('users', 'is_approved',                  'TINYINT(1) NOT NULL DEFAULT 0');
  anyNew |= await addColumnIfMissing('users', 'is_verified',                   'TINYINT(1) NOT NULL DEFAULT 0');
  anyNew |= await addColumnIfMissing('users', 'verification_token',            'VARCHAR(128) NULL');
  anyNew |= await addColumnIfMissing('users', 'verification_token_expires_at', 'DATETIME NULL');

  // Only backfill existing rows when the columns are brand-new; if they
  // already exist, any is_approved=0 row is a genuine pending caregiver.
  if (anyNew) {
    await pool.query(`UPDATE users SET is_approved = 1, is_verified = 1 WHERE is_approved = 0`);
    console.log('[migrate] Backfilled pre-existing users to approved+verified ✓');
  }

  // Ensure the admin account is always approved+verified (self-healing).
  await pool.query(`
    UPDATE users
       SET is_approved = 1, is_verified = 1
     WHERE role = 'admin'
       AND (is_approved = 0 OR is_verified = 0)
  `);
}

/**
 * Step 2 — caregiver_id FKs: CASCADE → SET NULL.
 * Prevents patient/visit data being wiped when a caregiver account is deleted.
 */
async function migrateSetNullFKs() {
  // patients.caregiver_id
  if ((await getFKDeleteRule('patients_ibfk_1')) !== 'SET NULL') {
    try {
      await pool.query('ALTER TABLE patients MODIFY COLUMN caregiver_id INT NULL');
      await pool.query('ALTER TABLE patients DROP FOREIGN KEY patients_ibfk_1');
      await pool.query(`
        ALTER TABLE patients
          ADD CONSTRAINT patients_ibfk_1
          FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('[migrate] patients.caregiver_id → ON DELETE SET NULL ✓');
    } catch (e) {
      // May fail if the FK name differs on this DB instance — not fatal.
      console.warn('[migrate] patients FK skip:', e.message);
    }
  }

  // visits.caregiver_id
  if ((await getFKDeleteRule('visits_ibfk_2')) !== 'SET NULL') {
    try {
      await pool.query('ALTER TABLE visits MODIFY COLUMN caregiver_id INT NULL');
      await pool.query('ALTER TABLE visits DROP FOREIGN KEY visits_ibfk_2');
      await pool.query(`
        ALTER TABLE visits
          ADD CONSTRAINT visits_ibfk_2
          FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('[migrate] visits.caregiver_id → ON DELETE SET NULL ✓');
    } catch (e) {
      console.warn('[migrate] visits FK skip:', e.message);
    }
  }
}

/**
 * Step 3 — widen board_selections.label to VARCHAR(500).
 * The UI allows 500 chars; the old column was only 100 → silent truncation.
 */
async function migrateLabelLength() {
  const len = await getColumnCharMax('board_selections', 'label');
  if (len !== null && len < 500) {
    await pool.query('ALTER TABLE board_selections MODIFY COLUMN label VARCHAR(500) NOT NULL');
    console.log('[migrate] board_selections.label widened to VARCHAR(500) ✓');
  }
}

// ── entry point ───────────────────────────────────────────────────────────────

async function autoMigrate() {
  try {
    await migrateApprovalColumns();
    await migrateSetNullFKs();
    await migrateLabelLength();
    console.log('[migrate] Schema up-to-date ✓');
  } catch (err) {
    // Log the error but don't crash — the server can still serve routes
    // that don't touch the affected columns.
    console.error('[migrate] Auto-migration error:', err.message);
  }
}

module.exports = { autoMigrate };
