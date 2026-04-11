const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

/* ================= CREATE DINING RESERVATION ================= */
router.post("/", verifyToken, (req, res) => {
  const { place_id, customer_name, customer_email, res_date, res_time, people_count, table_id, phone, special_requests } = req.body;
  const customerId = req.user.id;

  // Find owner_id of the place
  db.query("SELECT owner_id FROM places WHERE id = ?", [place_id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: "Place not found" });
    
    const ownerId = results[0].owner_id;

    const sql = `
      INSERT INTO dining_reservations 
      (customer_id, owner_id, place_id, table_id, reservation_date, reservation_time, party_size, full_name, email, phone, special_requests, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `;

    const values = [customerId, ownerId, place_id, table_id || null, res_date, res_time, people_count, customer_name, customer_email, phone || '', special_requests || ''];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Reservation failed" });
      }
      res.json({ message: "Table Reservation submitted! 🍽️", id: result.insertId });
    });
  });
});

/* ================= FULL GET FOR OWNER ================= */
router.get("/owner/all", verifyToken, (req, res) => {
  const ownerId = req.user.id;
  
  const sql = `
    SELECT dr.*, rt.table_no, p.name as place_name
    FROM dining_reservations dr
    LEFT JOIN restaurant_tables rt ON dr.table_id = rt.id
    JOIN places p ON dr.place_id = p.id
    WHERE dr.owner_id = ?
    ORDER BY dr.reservation_date DESC, dr.reservation_time ASC
  `;

  db.query(sql, [ownerId], (err, results) => {
    if (err) return res.status(500).json({ message: "Fetch failed" });
    res.json(results);
  });
});

module.exports = router;
