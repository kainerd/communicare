const mysql = require('mysql2/promise');
require('dotenv').config();

// Railway injects MYSQL_URL (e.g. mysql://user:pass@host:port/db).
// Fall back to individual DB_* vars for local / XAMPP development.
function buildPoolConfig() {
  const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (url) {
    // Parse the connection string so mysql2 gets discrete fields
    // (mysql2 doesn't accept a raw URI in createPool on all versions)
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 3306,
      user: parsed.username,
      password: parsed.password,
      database: parsed.pathname.replace(/^\//, ''),
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'communicare',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

const pool = mysql.createPool(buildPoolConfig());

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ MySQL connected successfully');
    connection.release();
  } catch (err) {
    console.error('✗ MySQL connection failed:', err.message);
    // Don't crash on startup — DB may not be configured yet
  }
}

module.exports = { pool, testConnection };
