import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

let pool;
let initPromise;

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

    if (!(await columnExists(connection, "concerns", "admin_instructions"))) {
      await connection.query("ALTER TABLE concerns ADD COLUMN admin_instructions TEXT DEFAULT NULL");
    }

    if (!(await columnExists(connection, "concerns", "submission_type"))) {
      await connection.query("ALTER TABLE concerns ADD COLUMN submission_type ENUM('Concern','Feedback') NOT NULL DEFAULT 'Concern'");
    }

    if (!(await columnExists(connection, "concerns", "archived"))) {
      await connection.query("ALTER TABLE concerns ADD COLUMN archived TINYINT(1) NOT NULL DEFAULT 0");
    }

    if (!(await columnExists(connection, "concerns", "admin_seen"))) {
      await connection.query("ALTER TABLE concerns ADD COLUMN admin_seen TINYINT(1) NOT NULL DEFAULT 0");
      await connection.query("UPDATE concerns SET admin_seen = 1");
    }

    if (!(await columnExists(connection, "concerns", "admin_resolved_seen"))) {
      await connection.query("ALTER TABLE concerns ADD COLUMN admin_resolved_seen TINYINT(1) NOT NULL DEFAULT 1");
    }

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

    const [rows] = await connection.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (rows.length === 0) {
      const hashed = await bcrypt.hash("admin123", 10);
      await connection.query(
        `INSERT INTO users (role, full_name, email_address, password, dept)
         VALUES ('admin', 'System Administrator', 'admin@poly.edu', ?, 'Office of the Registrar')`,
        [hashed],
      );
    }
  } finally {
    connection.release();
  }
}

export async function query(...args) {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }

  await initPromise;
  return getPool().query(...args);
}
