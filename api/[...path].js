import bcrypt from "bcryptjs";
import express from "express";
import { getDatabaseConfigStatus, query } from "./lib/db.js";

const app = express();

function sendServerError(res, err, fallbackMessage = "Server error.") {
  if (err.message?.startsWith("Missing required environment variable")) {
    return res.status(503).json({
      message: "Database is not configured in Vercel. Add DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, and DB_NAME in Project Settings > Environment Variables.",
    });
  }

  if (["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "EHOSTUNREACH"].includes(err.code)) {
    return res.status(503).json({
      message: "Database connection failed. DB_HOST must be a hosted MySQL server reachable from Vercel, not localhost.",
    });
  }

  if (err.code === "ER_ACCESS_DENIED_ERROR") {
    return res.status(503).json({
      message: "Database login failed. Check DB_USER and DB_PASSWORD in Vercel environment variables.",
    });
  }

  if (err.code === "ER_BAD_DB_ERROR") {
    return res.status(503).json({
      message: "Database name was not found. Create the database or correct DB_NAME in Vercel.",
    });
  }

  return res.status(500).json({ message: err.sqlMessage || fallbackMessage });
}

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use((req, res, next) => {
  if (req.url === "/api") {
    req.url = "/";
  } else if (req.url.startsWith("/api/")) {
    req.url = req.url.slice(4);
  }
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "Backend is working" });
});

app.get("/health", async (req, res) => {
  const config = getDatabaseConfigStatus();

  if (!config.configured) {
    return res.status(503).json({
      ok: false,
      database: "missing-env",
      missing: config.missing,
    });
  }

  try {
    await query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (err) {
    console.error("Health check error:", err.message);
    sendServerError(res, err);
  }
});

app.get("/debug/schema", async (req, res) => {
  try {
    const [concernColumns] = await query("SHOW COLUMNS FROM concerns");
    const [messageColumns] = await query("SHOW COLUMNS FROM messages");
    const [userColumns] = await query("SHOW COLUMNS FROM users");
    res.json({
      users: userColumns.map((column) => ({ field: column.Field, type: column.Type })),
      concerns: concernColumns.map((column) => ({ field: column.Field, type: column.Type })),
      messages: messageColumns.map((column) => ({ field: column.Field, type: column.Type })),
    });
  } catch (err) {
    console.error("Schema debug error:", err.message);
    sendServerError(res, err);
  }
});

app.post("/register", async (req, res) => {
  const { role, full_name, email_address, password, course, dept } = req.body;

  if (!role || !full_name || !email_address || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      "INSERT INTO users (role, full_name, email_address, password, course, dept) VALUES (?, ?, ?, ?, ?, ?)",
      [role, full_name, email_address, hashedPassword, course || null, dept || null],
    );

    res.json({ message: "User registered successfully." });
  } catch (err) {
    console.error("Register error:", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists." });
    }
    sendServerError(res, err);
  }
});

app.post("/login", async (req, res) => {
  const { email_address, password, role } = req.body;

  if (!email_address || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const [rows] = await query(
      "SELECT * FROM users WHERE email_address = ? AND role = ? LIMIT 1",
      [email_address, role],
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials. Please check your email, password, and selected role." });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials. Please check your email, password, and selected role." });
    }

    res.json({
      id: user.id,
      name: user.full_name,
      email: user.email_address,
      role: user.role,
      course: user.course || "",
      dept: user.dept || "",
      year: user.year || "",
    });
  } catch (err) {
    console.error("Login error:", err.message);
    sendServerError(res, err);
  }
});

app.get("/users", async (req, res) => {
  try {
    const [rows] = await query(
      "SELECT id, role, full_name as name, email_address as email, course, dept FROM users ORDER BY id DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error("Get users error:", err.message);
    sendServerError(res, err);
  }
});

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Delete user error:", err.message);
    sendServerError(res, err);
  }
});

app.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { full_name, email_address, role, course, dept, password } = req.body;
  const fields = [];
  const values = [];

  if (full_name) {
    fields.push("full_name = ?");
    values.push(full_name);
  }
  if (email_address) {
    fields.push("email_address = ?");
    values.push(email_address);
  }
  if (role) {
    fields.push("role = ?");
    values.push(role);
  }
  if (course !== undefined) {
    fields.push("course = ?");
    values.push(course || null);
  }
  if (dept !== undefined) {
    fields.push("dept = ?");
    values.push(dept || null);
  }
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    fields.push("password = ?");
    values.push(hashed);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "No valid fields to update." });
  }

  values.push(id);

  try {
    const [result] = await query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ message: "User updated successfully." });
  } catch (err) {
    console.error("Update user error:", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists." });
    }
    sendServerError(res, err);
  }
});

app.get("/concerns", async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT id, student_id as studentId, student_name as studentName, subject, category, description,
             priority, status, assigned_to as assignedTo, assigned_name as assignedName, remarks,
             admin_instructions as adminInstructions,
             submission_type as submissionType,
             archived,
             admin_seen as adminSeen,
             admin_resolved_seen as adminResolvedSeen,
             attached_file_name as attachedFileName, attached_file_type as attachedFileType,
             attached_file_data as attachedFileData,
             DATE_FORMAT(date, '%Y-%m-%d') as date
      FROM concerns ORDER BY id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Get concerns error:", err.message);
    sendServerError(res, err);
  }
});

app.get("/concerns/daily-count/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
    const [rows] = await query(
      "SELECT COUNT(*) as total FROM concerns WHERE student_id = ? AND DATE(date) = CURDATE()",
      [studentId],
    );
    res.json({ count: rows[0].total, remaining: Math.max(0, 2 - rows[0].total) });
  } catch (err) {
    console.error("Daily count error:", err.message);
    sendServerError(res, err);
  }
});

app.post("/concerns", async (req, res) => {
  const {
    studentId,
    studentName,
    subject,
    category,
    description,
    priority,
    submissionType,
    attachedFileName,
    attachedFileType,
    attachedFileData,
  } = req.body;

  if (!studentId || !studentName || !subject || !category || !description) {
    return res.status(400).json({ message: "Required fields missing." });
  }

  try {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const [countRows] = await query(
      "SELECT COUNT(*) as total FROM concerns WHERE student_id = ? AND DATE(date) = ?",
      [studentId, date],
    );
    if (countRows[0].total >= 2) {
      return res.status(429).json({
        message: "Daily limit reached. You can only submit 2 concerns per day. Please try again tomorrow.",
        limitReached: true,
      });
    }

    const [result] = await query(
      `INSERT INTO concerns
       (student_id, student_name, subject, category, description, priority, submission_type, attached_file_name, attached_file_type, attached_file_data, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        studentName,
        subject,
        category,
        description,
        priority || "Medium",
        submissionType || "Concern",
        attachedFileName,
        attachedFileType,
        attachedFileData,
        date,
      ],
    );

    res.json({ id: result.insertId, message: "Concern submitted successfully." });
  } catch (err) {
    console.error("Create concern error:", err.message, err.sqlMessage || "");
    sendServerError(res, err);
  }
});

app.patch("/concerns/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const allowedFields = ["status", "assigned_to", "assigned_name", "remarks", "priority", "admin_instructions", "archived", "admin_seen", "admin_resolved_seen"];
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    if (allowedFields.includes(snakeKey)) {
      fields.push(`${snakeKey} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "No valid fields to update." });
  }

  values.push(id);

  try {
    const [existing] = await query("SELECT id FROM concerns WHERE id = ? LIMIT 1", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Concern not found." });
    }

    await query(`UPDATE concerns SET ${fields.join(", ")} WHERE id = ?`, values);
    res.json({ message: "Concern updated successfully." });
  } catch (err) {
    console.error("Update concern error:", err.message);
    sendServerError(res, err);
  }
});

app.delete("/concerns/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await query("DELETE FROM concerns WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Concern not found." });
    }
    res.json({ message: "Concern deleted successfully." });
  } catch (err) {
    console.error("Delete concern error:", err.message);
    sendServerError(res, err);
  }
});

app.get("/concerns/:id/messages", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await query(
      "SELECT id, concern_id, sender_name, sender_role, message, created_at FROM messages WHERE concern_id = ? ORDER BY created_at ASC",
      [id],
    );
    res.json(rows);
  } catch (err) {
    console.error("Get messages error:", err.message);
    sendServerError(res, err);
  }
});

app.post("/concerns/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { senderName, senderRole, message } = req.body;

  if (!senderName || !senderRole || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const [concerns] = await query("SELECT id FROM concerns WHERE id = ? LIMIT 1", [id]);
    if (concerns.length === 0) {
      return res.status(404).json({ message: "Concern not found. Please refresh and try again." });
    }

    const [result] = await query(
      "INSERT INTO messages (concern_id, sender_name, sender_role, message) VALUES (?, ?, ?, ?)",
      [id, senderName, senderRole, message],
    );
    res.json({ id: result.insertId || null, message: "Message sent." });
  } catch (err) {
    console.error("Send message error:", err.message);
    sendServerError(res, err);
  }
});

export default app;
