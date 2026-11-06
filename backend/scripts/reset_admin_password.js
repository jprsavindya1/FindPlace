/**
 * ✅ FIX 6 — Admin Password Reset Script
 * Run: node scripts/reset_admin_password.js
 * This hashes a strong password and updates it in the DB.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const db = require("../db");

// ✅ Change this to your desired strong admin password
const NEW_ADMIN_PASSWORD = "FindPlace@Admin2026!";
const ADMIN_EMAIL = "admin@findplace.com";

(async () => {
  try {
    const hashed = await bcrypt.hash(NEW_ADMIN_PASSWORD, 12);

    db.query(
      "UPDATE users SET password = ? WHERE email = ? AND role = 'admin'",
      [hashed, ADMIN_EMAIL],
      (err, result) => {
        if (err) {
          console.error("❌ Error updating admin password:", err.message);
          process.exit(1);
        }
        if (result.affectedRows === 0) {
          console.warn("⚠️  No admin user found with email:", ADMIN_EMAIL);
        } else {
          console.log("✅ Admin password updated successfully!");
          console.log("   Email   :", ADMIN_EMAIL);
          console.log("   Password: [hidden — check your script]");
        }
        process.exit(0);
      }
    );
  } catch (err) {
    console.error("❌ Script error:", err.message);
    process.exit(1);
  }
})();
