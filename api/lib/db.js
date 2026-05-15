import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

let pool;
let initPromise;

const REQUIRED_ENV = ["DB_HOST", "DB_USER", "DB_NAME"];
const CONCERN_TABLE = "concern_tbl";
const MESSAGE_TABLE = "message_tbl";

export function getDatabaseConfigStatus() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);

  return {
    configured: missing.length === 0,
    missing,
  };
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: requiredEnv("DB_HOST"),
      user: requiredEnv("DB_USER"),
      password: process.env.DB_PASSWORD || "",
      database: requiredEnv("DB_NAME"),
      port: process.env.DB_PORT || 3306,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }

  return pool;
}

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [requiredEnv("DB_NAME"), tableName, columnName],
  );

  return rows.length > 0;
}

async function ensureColumn(connection, tableName, columnName, definition) {
  if (!(await columnExists(connection, tableName, columnName))) {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
}

async function initializeDatabase() {
  const connection = await getPool().getConnection();

  try {
    await connection.query(`
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

    await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('student','staff','admin') NOT NULL DEFAULT 'student'");
    await ensureColumn(connection, "users", "course", "course VARCHAR(100) DEFAULT NULL");
    await ensureColumn(connection, "users", "dept", "dept VARCHAR(150) DEFAULT NULL");

    await connection.query(`
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

    await connection.query("ALTER TABLE concerns MODIFY COLUMN category VARCHAR(100) NOT NULL");
    await connection.query("UPDATE concerns SET category = 'Services' WHERE category = 'Academic'");
    await connection.query("UPDATE concerns SET category = 'Administrative Concern' WHERE category = 'Financial'");
    await connection.query("ALTER TABLE concerns MODIFY COLUMN category ENUM('Services','Facilities','Administrative Concern') NOT NULL");

    await ensureColumn(connection, "concerns", "admin_instructions", "admin_instructions TEXT DEFAULT NULL");
    await ensureColumn(connection, "concerns", "submission_type", "submission_type ENUM('Concern','Feedback') NOT NULL DEFAULT 'Concern'");
    await ensureColumn(connection, "concerns", "archived", "archived TINYINT(1) NOT NULL DEFAULT 0");

    const hadAdminSeen = await columnExists(connection, "concerns", "admin_seen");
    await ensureColumn(connection, "concerns", "admin_seen", "admin_seen TINYINT(1) NOT NULL DEFAULT 0");
    if (!hadAdminSeen) {
      await connection.query("UPDATE concerns SET admin_seen = 1");
    }

    await ensureColumn(connection, "concerns", "admin_resolved_seen", "admin_resolved_seen TINYINT(1) NOT NULL DEFAULT 1");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ${CONCERN_TABLE} (
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
        admin_instructions  TEXT DEFAULT NULL,
        submission_type     ENUM('Concern','Feedback') NOT NULL DEFAULT 'Concern',
        archived            TINYINT(1) NOT NULL DEFAULT 0,
        admin_seen          TINYINT(1) NOT NULL DEFAULT 0,
        admin_resolved_seen TINYINT(1) NOT NULL DEFAULT 1,
        attached_file_name  VARCHAR(255) DEFAULT NULL,
        attached_file_type  VARCHAR(100) DEFAULT NULL,
        attached_file_data  LONGTEXT DEFAULT NULL,
        date                DATE NOT NULL,
        created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      INSERT IGNORE INTO ${CONCERN_TABLE} (
        id, student_id, student_name, subject, category, description, priority, status,
        assigned_to, assigned_name, remarks, admin_instructions, submission_type, archived,
        admin_seen, admin_resolved_seen, attached_file_name, attached_file_type,
        attached_file_data, date, created_at
      )
      SELECT
        id, student_id, student_name, subject, category, description, priority, status,
        assigned_to, assigned_name, remarks, admin_instructions, submission_type, archived,
        admin_seen, admin_resolved_seen, attached_file_name, attached_file_type,
        attached_file_data, date, created_at
      FROM concerns
    `);

    await connection.query(`
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
    await ensureColumn(connection, "messages", "concern_id", "concern_id INT NOT NULL");
    await ensureColumn(connection, "messages", "sender_name", "sender_name VARCHAR(150) NOT NULL");
    await ensureColumn(connection, "messages", "sender_role", "sender_role ENUM('admin','staff','student') NOT NULL");
    await ensureColumn(connection, "messages", "message", "message TEXT NOT NULL");
    await ensureColumn(connection, "messages", "created_at", "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await connection.query("ALTER TABLE messages MODIFY COLUMN sender_role ENUM('admin','staff','student') NOT NULL");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ${MESSAGE_TABLE} (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        concern_id   INT NOT NULL,
        sender_name  VARCHAR(150) NOT NULL,
        sender_role  ENUM('admin','staff','student') NOT NULL,
        message      TEXT NOT NULL,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_message_concern_id (concern_id)
      )
    `);

    await connection.query(`
      INSERT IGNORE INTO ${MESSAGE_TABLE} (id, concern_id, sender_name, sender_role, message, created_at)
      SELECT id, concern_id, sender_name, sender_role, message, created_at
      FROM messages
    `);

    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@poly.edu";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
    const adminName = process.env.DEFAULT_ADMIN_NAME || "System Administrator";
    const adminDept = process.env.DEFAULT_ADMIN_DEPT || "Office of the Registrar";
    const hashed = await bcrypt.hash(adminPassword, 10);

    await connection.query(
      `INSERT INTO users (role, full_name, email_address, password, dept)
       VALUES ('admin', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         role = 'admin',
         full_name = VALUES(full_name),
         password = VALUES(password),
         dept = VALUES(dept)`,
      [adminName, adminEmail, hashed, adminDept],
    );
  } finally {
    connection.release();
  }
}

export async function query(...args) {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }

  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }

  return getPool().query(...args);
}
