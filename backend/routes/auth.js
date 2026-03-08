const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

// Google Auth Controller
const { googleAuth } = require("../controllers/authController");

const router = express.Router();

// ✅ allowed roles (normalized lowercase)
const ALLOWED_ROLES = ["customer", "owner", "admin"];

// ✅ helper to normalize role input
const normalizeRole = (role) => (role || "").toString().trim().toLowerCase();

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    let { name, email, password, role } = req.body;

    // basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // normalize inputs
    name = name.toString().trim();
    email = email.toString().trim().toLowerCase();
    role = normalizeRole(role);

    // role validation
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [name, email, hashedPassword, role], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Email already exists" });
        }
        console.error("REGISTER DB ERROR:", err);
        return res.status(500).json({ message: "Registration failed" });
      }

      return res.json({ message: "Registration successful" });
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN (ROLE STRICT) ================= */
router.post("/login", (req, res) => {
  let { email, password, role } = req.body;

  // required
  if (!email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // normalize
  email = email.toString().trim().toLowerCase();
  role = normalizeRole(role);

  // role validation
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  // ROLE included in query (no bypass)
  const sql = "SELECT * FROM users WHERE email = ? AND role = ? LIMIT 1";

  db.query(sql, [email, role], async (err, results) => {
    if (err) {
      console.error("LOGIN DB ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // not found OR role mismatch
    if (results.length === 0) {
      return res.status(403).json({ message: "Invalid credentials or role" });
    }

    const user = results[0];

    // password verify
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (e) {
      console.error("BCRYPT COMPARE ERROR:", e);
      return res.status(500).json({ message: "Server error" });
    }

    if (!isMatch) {
      return res.status(403).json({ message: "Invalid credentials or role" });
    }

    // JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "findplace_secret",
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      userId: user.id,
    });
  });
});

/* ================= GOOGLE LOGIN ================= */
router.post("/google", googleAuth);

module.exports = router;