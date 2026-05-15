require('dotenv').config();

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

let db;

async function initDB() {
  // Step 1: connect without a database to create it if needed
  const bootstrap = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    port:     process.env.DB_PORT || 3306,
  });

  await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  console.log(`✅ Database "${process.env.DB_NAME}" ready`);
  await bootstrap.end();

  // Step 2: connect to the actual database
  db = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    port:     process.env.DB_PORT || 3306,
  });
  console.log("✅ Database connected successfully!");

  // Step 3: create users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      role          ENUM('student','staff','admin') NOT NULL DEFAULT 'student',
      full_name     VARCHAR(150) NOT NULL,
      email_address VARCHAR(150) NOT NULL UNIQUE,
      password      VARCHAR(255) NOT NULL,
      course        VARCHAR(100) DEFAULT NULL,
      dept          VARCHAR(150) DEFAULT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ users table ready");

  // Step 3.5: create concerns table
  await db.query(`
    CREATE TABLE IF NOT EXISTS concerns (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      student_id          INT NOT NULL,
      student_name        VARCHAR(150) NOT NULL,
      subject             VARCHAR(255) NOT NULL,
      category            ENUM('Services','Facilities','Administrative Concern') NOT NULL,
      description         TEXT NOT NULL,
      priority            ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
      status              ENUM('Pending','In Progress','Resolved') NOT NULL DEFAULT 'Pending',
      assigned_to         INT DEFAULT NULL,
      assigned_name       VARCHAR(150) DEFAULT NULL,
      remarks             TEXT DEFAULT NULL,
      attached_file_name  VARCHAR(255) DEFAULT NULL,
      attached_file_type  VARCHAR(100) DEFAULT NULL,
      attached_file_data  LONGTEXT DEFAULT NULL,
      date                DATE NOT NULL,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Always ensure the category ENUM is up to date (handles existing tables with old values)
  // Step 1: Widen to VARCHAR so any value is accepted
  await db.query(`ALTER TABLE concerns MODIFY COLUMN category VARCHAR(100) NOT NULL`);
  await db.query(`UPDATE concerns SET category = 'Services' WHERE category = 'Academic'`);
  await db.query(`UPDATE concerns SET category = 'Administrative Concern' WHERE category = 'Financial'`);
  await db.query(`ALTER TABLE concerns MODIFY COLUMN category ENUM('Services','Facilities','Administrative Concern') NOT NULL`);

  // Add admin_instructions column if it doesn't exist (compatible with MySQL 5.7+)
  const [cols] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'concerns' AND COLUMN_NAME = 'admin_instructions'
  `, [process.env.DB_NAME]);
  if (cols.length === 0) {
    await db.query(`ALTER TABLE concerns ADD COLUMN admin_instructions TEXT DEFAULT NULL`);
    console.log("✅ admin_instructions column added");
  }

  // Add submission_type column if it doesn't exist
  const [typeCols] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'concerns' AND COLUMN_NAME = 'submission_type'
  `, [process.env.DB_NAME]);
  if (typeCols.length === 0) {
    await db.query(`ALTER TABLE concerns ADD COLUMN submission_type ENUM('Concern','Feedback') NOT NULL DEFAULT 'Concern'`);
    console.log("✅ submission_type column added");
  }
  // Add archive and admin notification tracking columns if they don't exist
  const [archiveCols] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'concerns' AND COLUMN_NAME = 'archived'
  `, [process.env.DB_NAME]);
  if (archiveCols.length === 0) {
    await db.query(`ALTER TABLE concerns ADD COLUMN archived TINYINT(1) NOT NULL DEFAULT 0`);
    console.log("archived column added");
  }

  const [seenCols] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'concerns' AND COLUMN_NAME = 'admin_seen'
  `, [process.env.DB_NAME]);
  if (seenCols.length === 0) {
    await db.query(`ALTER TABLE concerns ADD COLUMN admin_seen TINYINT(1) NOT NULL DEFAULT 0`);
    await db.query(`UPDATE concerns SET admin_seen = 1`);
    console.log("admin_seen column added");
  }

  const [resolvedSeenCols] = await db.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'concerns' AND COLUMN_NAME = 'admin_resolved_seen'
  `, [process.env.DB_NAME]);
  if (resolvedSeenCols.length === 0) {
    await db.query(`ALTER TABLE concerns ADD COLUMN admin_resolved_seen TINYINT(1) NOT NULL DEFAULT 1`);
    console.log("admin_resolved_seen column added");
  }
  console.log("✅ concerns table ready");

  // Step 3.6: create messages table
  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      concern_id   INT NOT NULL,
      sender_name  VARCHAR(150) NOT NULL,
      sender_role  ENUM('admin','staff','student') NOT NULL,
      message      TEXT NOT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (concern_id) REFERENCES concerns(id) ON DELETE CASCADE
    )
  `);
  console.log("✅ messages table ready");  // Step 4: seed default admin if none exists
  const [rows] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (rows.length === 0) {
    const hashed = await bcrypt.hash("admin123", 10);
    await db.query(
      `INSERT INTO users (role, full_name, email_address, password, dept)
       VALUES ('admin', 'System Administrator', 'admin@poly.edu', ?, 'Office of the Registrar')`,
      [hashed]
    );
    console.log("✅ Default admin seeded → admin@poly.edu / admin123");
  }
}

// Wrap db access so server.js can use db.query() the same way
const handler = {
  query: (...args) => db.query(...args),
};

initDB().catch(err => {
  console.error("❌ DB init failed:", err.message);
  process.exit(1);
});

module.exports = handler;
