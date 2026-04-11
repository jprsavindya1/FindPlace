const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

/* =================================================
   GET REVIEWS BY PLACE (PUBLIC)
   GET /api/reviews/place/:placeId
   ================================================= */
router.get("/place/:placeId", (req, res) => {
  const placeId = req.params.placeId;

  const sql = `
    SELECT 
      r.id,
      r.rating,
      r.comment,
      r.created_at,
      u.name AS customer_name
    FROM reviews r
    JOIN users u ON r.customer_id = u.id
    WHERE r.place_id = ?
    ORDER BY r.created_at DESC
  `;

  db.query(sql, [placeId], (err, results) => {
    if (err) {
      console.error("Fetch reviews error:", err);
      return res.status(500).json({ message: "Failed to fetch reviews" });
    }
    res.json(results);
  });
});

/* =================================================
   GET REVIEW SUMMARY (AVG + COUNT)
   GET /api/reviews/summary/:placeId
   ================================================= */
router.get("/summary/:placeId", (req, res) => {
  const placeId = req.params.placeId;

  const sql = `
    SELECT 
      ROUND(AVG(rating), 1) AS avgRating,
      COUNT(*) AS totalReviews
    FROM reviews
    WHERE place_id = ?
  `;

  db.query(sql, [placeId], (err, results) => {
    if (err) {
      console.error("Summary error:", err);
      return res.status(500).json({ message: "Failed to fetch rating summary" });
    }

    const row = results[0] || {};
    res.json({
      avgRating: row.avgRating || 0,
      totalReviews: row.totalReviews || 0,
    });
  });
});

/* =================================================
   ADD REVIEW (CUSTOMER ONLY)
   POST /api/reviews
   Body: { place_id, rating, comment }
   ================================================= */
router.post("/", verifyToken, (req, res) => {
  const { place_id, rating, comment } = req.body;

  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Customers only" });
  }

  if (!place_id || !rating) {
    return res.status(400).json({ message: "place_id and rating are required" });
  }

  const r = Number(rating);
  if (Number.isNaN(r) || r < 1 || r > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  if (comment && String(comment).length > 500) {
    return res.status(400).json({ message: "Comment too long (max 500 chars)" });
  }

  // ✅ Validation: Check both Stays (bookings) and Dining (reservations)
  const bookingCheckSql = `
    SELECT id FROM bookings 
    WHERE place_id = ? AND customer_id = ? AND status = 'APPROVED'
    UNION
    SELECT id FROM reservations 
    WHERE place_id = ? AND user_id = ? AND status IN ('confirmed', 'completed')
    LIMIT 1
  `;

  db.query(bookingCheckSql, [place_id, req.user.id, place_id, req.user.id], (err, results) => {
    if (err) {
      console.error("Booking check error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (!results || results.length === 0) {
      return res.status(403).json({
        message: "Only customers with an approved booking or confirmed reservation can add a review",
      });
    }

    const insertSql = `
      INSERT INTO reviews (place_id, customer_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [place_id, req.user.id, r, comment || null],
      (err2) => {
        if (err2) {
          // if unique constraint exists -> duplicate review
          if (err2.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "You already reviewed this place" });
          }
          console.error("Insert review error:", err2);
          return res.status(500).json({ message: "Failed to add review" });
        }

        res.json({ message: "Review added successfully" });
      }
    );
  });
});

module.exports = router;