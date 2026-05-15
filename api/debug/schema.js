import { getSchemaSnapshot } from "../lib/db.js";

function sendError(res, err) {
  if (err.message?.startsWith("Missing required environment variable")) {
    return res.status(503).json({
      message: "Database is not configured in Vercel.",
      error: err.message,
    });
  }

  return res.status(500).json({
    message: err.sqlMessage || err.message || "Server error.",
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  try {
    res.json(await getSchemaSnapshot());
  } catch (err) {
    console.error("Schema debug error:", err.message);
    sendError(res, err);
  }
}
