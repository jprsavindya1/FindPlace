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
    let { name, email, password, role, business_type, phone } = req.body;

    // basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // normalize inputs
    name = name.toString().trim();
    email = email.toString().trim().toLowerCase();
    role = normalizeRole(role);
    const phoneNum = phone ? phone.toString().trim() : null;

    // role validation
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (name, email, password, role, business_type, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, email, hashedPassword, role, business_type || 'accommodation', phoneNum], (err) => {
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
      { id: user.id, role: user.role, businessType: user.business_type },
      process.env.JWT_SECRET || "findplace_secret",
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role,
      businessType: user.business_type,
      userId: user.id,
      name: user.name,
    });
  });
});

/* ================= FORGOT PASSWORD (SIMULATED) ================= */
router.post("/forgot-password", (req, res) => {
  let { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  email = email.toString().trim().toLowerCase();

  // Check if user exists
  const sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("FORGOT PASSWORD DB ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    // SIMULATION SUCCESS
    // In a real app, you would generate a token and send an actual email here.
    return res.json({ 
      message: "Reset link sent! Please check your email inbox (Simulated).",
      success: true 
    });
  });
});

/* ================= GOOGLE LOGIN ================= */
router.post("/google", googleAuth);

module.exports = router;