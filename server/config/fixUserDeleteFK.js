/**
 * Migration: change patients.caregiver_id and visits.caregiver_id from
 * ON DELETE CASCADE to ON DELETE SET NULL (and make both columns nullable).
 *
 * Why: deleting a caregiver User account must NOT delete the patients or
 * visit history they worked on — only unlink them (an admin can then
 * reassign orphaned patients to another caregiver). The original schema
 * had these as CASCADE, which would silently wipe out clinical data on
 * user deletion.
 *
 * Safe to re-run — checks existing DELETE_RULE before altering.
 * Usage: node config/fixUserDeleteFK.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function getDeleteRule(db, dbName, constraintName) {
  const [rows] = await db.query(
    `SELECT DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ? AND CONSTRAINT_NAME = ?`,
    [dbName, constraintName],
  );
  return rows[0]?.DELETE_RULE || null;
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

  // patients.caregiver_id (FK: patients_ibfk_1)
  if (await getDeleteRule(db, dbName, 'patients_ibfk_1') === 'SET NULL') {
    console.log('patients.caregiver_id already ON DELETE SET NULL — skipped');
  } else {
    await db.query('ALTER TABLE patients MODIFY COLUMN caregiver_id INT NULL');
    await db.query('ALTER TABLE patients DROP FOREIGN KEY patients_ibfk_1');
    await db.query(
      `ALTER TABLE patients
       ADD CONSTRAINT patients_ibfk_1 FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE SET NULL`,
    );
    console.log('patients.caregiver_id -> nullable + ON DELETE SET NULL ✓');
  }

  // visits.caregiver_id (FK: visits_ibfk_2)
  if (await getDeleteRule(db, dbName, 'visits_ibfk_2') === 'SET NULL') {
    console.log('visits.caregiver_id already ON DELETE SET NULL — skipped');
  } else {
    await db.query('ALTER TABLE visits MODIFY COLUMN caregiver_id INT NULL');
    await db.query('ALTER TABLE visits DROP FOREIGN KEY visits_ibfk_2');
    await db.query(
      `ALTER TABLE visits
       ADD CONSTRAINT visits_ibfk_2 FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE SET NULL`,
    );
    console.log('visits.caregiver_id -> nullable + ON DELETE SET NULL ✓');
  }

  await db.end();
  console.log('\n✓ FK migration complete.');
}

run().catch((e) => { console.error('Migration failed:', e.message); process.exit(1); });
