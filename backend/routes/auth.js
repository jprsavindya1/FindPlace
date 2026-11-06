const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

// Google Auth Controller
const { googleAuth } = require("../controllers/authController");

const router = express.Router();

// ✅ allowed roles (normalized lowercase)
const ALLOWED_ROLES = ["customer", "owner", "admin"];

// ✅ helper to normalize role input
const normalizeRole = (role) => (role || "").toString().trim().toLowerCase();

/* ================= RATE LIMITERS (FIX 8 — Brute Force Protection) ================= */
// Login: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Forgot password: max 5 requests per 30 minutes per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: { message: "Too many password reset requests. Please try again in 30 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register: max 10 per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Too many registrations from this IP. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/* ================= NODEMAILER TRANSPORTER ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your real password)
  },
});

/* ================= REGISTER ================= */
router.post("/register", registerLimiter, async (req, res) => {
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
router.post("/login", loginLimiter, (req, res) => {
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

/* ================= FORGOT PASSWORD (REAL EMAIL) ================= */
router.post("/forgot-password", forgotPasswordLimiter, (req, res) => {
  let { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  email = email.toString().trim().toLowerCase();

  // Check if user exists
  const sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("FORGOT PASSWORD DB ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // ✅ Don't reveal if email exists (security best practice)
    if (results.length === 0) {
      return res.json({
        message: "If an account exists with this email, a reset link has been sent.",
        success: true,
      });
    }

    const user = results[0];

    // ✅ Generate a short-lived reset token (15 minutes)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, purpose: "password-reset" },
      process.env.JWT_SECRET || "findplace_secret",
      { expiresIn: "15m" }
    );

    // ✅ Build reset URL pointing to frontend
    const frontendOrigin = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",")[0].trim();
    const resetUrl = `${frontendOrigin}/reset-password?token=${resetToken}`;

    // ✅ Send real email via Nodemailer
    const mailOptions = {
      from: `"FindPlace Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔐 FindPlace — Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
          <h2 style="color: #818cf8;">🔐 Reset Your Password</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>We received a request to reset your password for your FindPlace account.</p>
          <p>Click the button below to reset it. This link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}"
             style="display:inline-block; margin: 20px 0; padding: 12px 28px; background: #6366f1; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
          <p style="font-size: 12px; color: #94a3b8;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
          <hr style="border-color: #1e293b; margin-top: 20px;">
          <p style="font-size: 11px; color: #64748b;">© 2026 FindPlace · Sri Lanka</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to: ${user.email}`);
      return res.json({
        message: "If an account exists with this email, a reset link has been sent.",
        success: true,
      });
    } catch (mailErr) {
      console.error("EMAIL SEND ERROR:", mailErr);
      return res.status(500).json({ message: "Failed to send email. Please try again later." });
    }
  });
});

/* ================= GOOGLE LOGIN ================= */
router.post("/google", googleAuth);

/* ================= REFRESH TOKEN (FIX 9) ================= */
// Issues a new access token using a valid refresh token stored in httpOnly cookie
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "findplace_refresh_secret"
    );

    // Issue new short-lived access token
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role, businessType: decoded.businessType },
      process.env.JWT_SECRET || "findplace_secret",
      { expiresIn: "15m" }
    );

    return res.json({ token: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// ✅ Issue refresh token (called after successful login — internal helper)
// Attach this after login if you want to store refresh token as httpOnly cookie:
// res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 7*24*60*60*1000 });

/* ================= LOGOUT ================= */
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "strict" });
  return res.json({ message: "Logged out successfully" });
});

module.exports = router;