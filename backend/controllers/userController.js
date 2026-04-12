const db = require("../db");
const bcrypt = require("bcryptjs");

// Get Profile
exports.getProfile = (req, res) => {
  const userId = req.user.id;
  const sql = "SELECT id, name, email, phone, role, profile_pic, about FROM users WHERE id = ?";

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    res.json(results[0]);
  });
};

// Update Profile
exports.updateProfile = (req, res) => {
  const userId = req.user.id;
  const { name, phone, about } = req.body;

  const sql = "UPDATE users SET name = ?, phone = ?, about = ? WHERE id = ?";
  db.query(sql, [name, phone, about, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "Profile updated successfully" });
  });
};

// Upload Profile Picture (With Cleanup)
exports.uploadProfilePic = (req, res) => {
  const userId = req.user.id;
  const profilePic = req.file ? req.file.filename : null;

  if (!profilePic) {
    return res.status(400).json({ message: "Please upload an image" });
  }

  // 1. Get old pic to delete
  db.query("SELECT profile_pic FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    const oldPic = results[0]?.profile_pic;

    // 2. Update DB
    const sql = "UPDATE users SET profile_pic = ? WHERE id = ?";
    db.query(sql, [profilePic, userId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error during image update" });
      }

      // 3. Cleanup old file
      if (oldPic) {
        const path = require("path");
        const fs = require("fs");
        const oldPath = path.join("uploads/profiles/", oldPic);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      res.json({ message: "Profile picture updated successfully", profile_pic: profilePic });
    });
  });
};


// Change Password
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  const sql = "SELECT password FROM users WHERE id = ?";
  db.query(sql, [userId], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSql = "UPDATE users SET password = ? WHERE id = ?";
    db.query(updateSql, [hashedPassword, userId], (err) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "Password changed successfully" });
    });
  });
};
