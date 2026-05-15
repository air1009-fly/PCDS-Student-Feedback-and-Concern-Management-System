require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,  // allow any localhost port
  credentials: true
}));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/* =========================
   TEST ROUTE (important)
========================= */
app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

/* =========================
   REGISTER API
========================= */
app.post('/register', async (req, res) => {
  console.log("📩 RAW BODY:", req.body);

  const { role, full_name, email_address, password, course, dept } = req.body;

  if (!role || !full_name || !email_address || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (role, full_name, email_address, password, course, dept) VALUES (?, ?, ?, ?, ?, ?)`,
      [role, full_name, email_address, hashedPassword, course || null, dept || null]
    );
    console.log("✅ User registered:", email_address);
    res.json({ message: "User registered successfully." });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists." });
    }
    res.status(500).json({ message: "Server error." });
  }
});

/* =========================
   LOGIN API
========================= */
app.post('/login', async (req, res) => {
  const { email_address, password, role } = req.body;

  if (!email_address || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email_address = ? AND role = ? LIMIT 1",
      [email_address, role]
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
      id:     user.id,
      name:   user.full_name,
      email:  user.email_address,
      role:   user.role,
      course: user.course || "",
      dept:   user.dept   || "",
      year:   user.year   || "",
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

/* =========================
   GET ALL USERS API
========================= */
app.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, role, full_name as name, email_address as email, course, dept FROM users ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Get users error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

/* =========================
   DELETE USER API
========================= */
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    console.log("✅ User deleted:", id);
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("❌ Delete user error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

/* =========================
   UPDATE USER API
========================= */
app.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, email_address, role, course, dept, password } = req.body;

  const fields = [];
  const values = [];

  if (full_name)     { fields.push("full_name = ?");     values.push(full_name); }
  if (email_address) { fields.push("email_address = ?"); values.push(email_address); }
  if (role)          { fields.push("role = ?");          values.push(role); }
  if (course !== undefined) { fields.push("course = ?"); values.push(course || null); }
  if (dept  !== undefined)  { fields.push("dept = ?");   values.push(dept  || null); }
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
    const [result] = await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    console.log("✅ User updated:", id);
    res.json({ message: "User updated successfully." });
  } catch (err) {
    console.error("❌ Update user error:", err.message);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already exists." });
    }
    res.status(500).json({ message: "Server error." });
  }
});

/* =========================
   CONCERNS API
========================= */
// Get all concerns
app.get('/concerns', async (req, res) => {
  try {
    const [rows] = await db.query(`
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
    console.error("❌ Get concerns error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Get today's submission count for a student
app.get('/concerns/daily-count/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) as total FROM concerns WHERE student_id = ? AND DATE(date) = CURDATE()",
      [studentId]
    );
    res.json({ count: rows[0].total, remaining: Math.max(0, 2 - rows[0].total) });
  } catch (err) {
    console.error("❌ Daily count error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Create a new concern
app.post('/concerns', async (req, res) => {
  const { studentId, studentName, subject, category, description, priority, submissionType, attachedFileName, attachedFileType, attachedFileData } = req.body;
  
  if (!studentId || !studentName || !subject || !category || !description) {
    return res.status(400).json({ message: "Required fields missing." });
  }

  try {
    // Use local date (YYYY-MM-DD) for the daily limit check
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    // ── Daily limit: max 2 concerns per student per day ──
    const [countRows] = await db.query(
      "SELECT COUNT(*) as total FROM concerns WHERE student_id = ? AND DATE(date) = ?",
      [studentId, date]
    );
    if (countRows[0].total >= 2) {
      return res.status(429).json({
        message: "Daily limit reached. You can only submit 2 concerns per day. Please try again tomorrow.",
        limitReached: true,
      });
    }

    const [result] = await db.query(`
      INSERT INTO concerns (student_id, student_name, subject, category, description, priority, submission_type, attached_file_name, attached_file_type, attached_file_data, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [studentId, studentName, subject, category, description, priority || 'Medium', submissionType || 'Concern', attachedFileName, attachedFileType, attachedFileData, date]);
    
    console.log("✅ Concern created:", result.insertId);
    res.json({ id: result.insertId, message: "Concern submitted successfully." });
  } catch (err) {
    console.error("❌ Create concern error:", err.message, err.sqlMessage || "");
    res.status(500).json({ message: err.sqlMessage || "Server error." });
  }
});

// Update a concern
app.patch('/concerns/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const allowedFields = ['status', 'assigned_to', 'assigned_name', 'remarks', 'priority', 'admin_instructions', 'archived', 'admin_seen', 'admin_resolved_seen'];
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
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
    await db.query(`UPDATE concerns SET ${fields.join(', ')} WHERE id = ?`, values);
    console.log("✅ Concern updated:", id);
    res.json({ message: "Concern updated successfully." });
  } catch (err) {
    console.error("❌ Update concern error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Delete a concern
app.delete('/concerns/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM concerns WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Concern not found." });
    }
    console.log("Concern deleted:", id);
    res.json({ message: "Concern deleted successfully." });
  } catch (err) {
    console.error("Delete concern error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

/* =========================
   MESSAGES API
========================= */
// Get messages for a concern
app.get('/concerns/:id/messages', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT id, concern_id, sender_name, sender_role, message, created_at FROM messages WHERE concern_id = ? ORDER BY created_at ASC",
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Get messages error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Post a message to a concern
app.post('/concerns/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { senderName, senderRole, message } = req.body;
  if (!senderName || !senderRole || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO messages (concern_id, sender_name, sender_role, message) VALUES (?, ?, ?, ?)",
      [id, senderName, senderRole, message]
    );
    console.log("✅ Message sent:", result.insertId);
    res.json({ id: result.insertId, message: "Message sent." });
  } catch (err) {
    console.error("❌ Send message error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

/* =========================
   START SERVER (FIXED)
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
