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
  await db.query(
    "UPDATE users SET is_approved=1, is_verified=1 WHERE role='caregiver' AND (is_approved=0 OR is_verified=0)"
  );
  const [[row]] = await db.query('SELECT ROW_COUNT() AS n');
  console.log(`Approved + verified ${row.n} caregiver(s) ✓`);
  await db.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
