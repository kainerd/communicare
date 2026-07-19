require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function fix() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'communicare',
  });

  await db.query(
    "ALTER TABLE board_selections MODIFY COLUMN category ENUM('body_part','need','emotion','symptom','free_text') NOT NULL"
  );
  console.log('board_selections.category ENUM updated to include free_text ✓');

  await db.end();
}

fix().catch(e => { console.error('Fix failed:', e.message); process.exit(1); });
