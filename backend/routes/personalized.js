const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

// HELPER: Get last booking for a user
const getLastBooking = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT b.*, p.name as place_name, p.district, p.area, p.image as place_image
      FROM bookings b
      JOIN places p ON b.place_id = p.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
      LIMIT 1
    `;
    db.query(sql, [userId], (err, results) => {
      if (err) reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};

// HELPER: Get suggestions based on location
const getSuggestions = (district, area, excludePlaceId) => {
  return new Promise((resolve, reject) => {
    let sql = "SELECT * FROM places WHERE status = 'approved' AND id != ?";
    const params = [excludePlaceId];

    if (area) {
      sql += " AND (area = ? OR district = ?)";
      params.push(area, district);
    } else if (district) {
      sql += " AND district = ?";
      params.push(district);
    }

    sql += " ORDER BY RAND() LIMIT 4";

    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
};

// GET /api/personalized/dashboard
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const lastBooking = await getLastBooking(userId);

    let suggestions = [];
    if (lastBooking) {
      suggestions = await getSuggestions(
        lastBooking.district,
        lastBooking.area,
        lastBooking.place_id
      );
    }

    res.json({
      lastBooking,
      suggestions,
    });
  } catch (error) {
    console.error("Personalized Dashboard Error:", error);
    res.status(500).json({ message: "Failed to fetch personalized data" });
  }
});

module.exports = router;
