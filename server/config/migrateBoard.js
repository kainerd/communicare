require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await conn.query(
    "ALTER TABLE board_selections MODIFY COLUMN category ENUM('body_part','need','emotion','symptom','free_text') NOT NULL"
  );
  console.log('board_selections.category ENUM extended to include free_text ✓');
  await conn.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
