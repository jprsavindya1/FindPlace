const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, verifyOwner } = require("../middleware/authMiddleware");

// ✅ TEMP CONFIRMATION (to ensure correct file is being loaded)
console.log("✅ NEW booking.js LOADED");

/* =================================================
   1️⃣ CREATE BOOKING (CUSTOMER ONLY) - AUTO ACCEPT/REJECT
   ================================================= */
router.post("/", verifyToken, (req, res) => {
  const { place_id, check_in, check_out } = req.body;

  // Role check
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Customers only" });
  }

  // Required fields
  if (!place_id || !check_in || !check_out) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Basic date validation
  const inDate = new Date(check_in);
  const outDate = new Date(check_out);

  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  if (outDate <= inDate) {
    return res.status(400).json({ message: "check_out must be after check_in" });
  }

  // Transaction to reduce double booking race conditions
  db.beginTransaction((txErr) => {
    if (txErr) {
      return res.status(500).json({ message: "Transaction start failed" });
    }

    // Lock place row (also ensure approved listing)
    const placeSql =
      "SELECT owner_id FROM places WHERE id = ? AND status = 'approved' FOR UPDATE";

    db.query(placeSql, [place_id], (err, placeResult) => {
      if (err) {
        return db.rollback(() =>
          res.status(500).json({ message: "Database error" })
        );
      }

      if (placeResult.length === 0) {
        return db.rollback(() =>
          res.status(404).json({ message: "Place not found or not approved" })
        );
      }

      const owner_id = placeResult[0].owner_id;

      // Check overlapping bookings for same place
      // Overlap if NOT (existing.check_out <= new.check_in OR existing.check_in >= new.check_out)
      const conflictSql = `
        SELECT id
        FROM bookings
        WHERE place_id = ?
          AND status IN ('APPROVED', 'PENDING')
          AND NOT (check_out <= ? OR check_in >= ?)
        LIMIT 1
        FOR UPDATE
      `;

      db.query(conflictSql, [place_id, check_in, check_out], (err, conflicts) => {
        if (err) {
          return db.rollback(() =>
            res.status(500).json({ message: "Database error" })
          );
        }

        // Conflict -> auto reject (Unavailable)
        if (conflicts.length > 0) {
          const rejectInsert = `
            INSERT INTO bookings (place_id, customer_id, owner_id, check_in, check_out, status)
            VALUES (?, ?, ?, ?, ?, 'REJECTED')
          `;

          return db.query(
            rejectInsert,
            [place_id, req.user.id, owner_id, check_in, check_out],
            (err, result) => {
              if (err) {
                return db.rollback(() =>
                  res.status(500).json({ message: "Booking failed" })
                );
              }

              db.commit((cErr) => {
                if (cErr) {
                  return db.rollback(() =>
                    res.status(500).json({ message: "Commit failed" })
                  );
                }

                // 409 -> Unavailable
                return res.status(409).json({
                  message: "Unavailable for selected dates",
                  status: "REJECTED",
                  booking_id: result.insertId,
                });
              });
            }
          );
        }

        // No conflict -> auto approve
        const approveInsert = `
          INSERT INTO bookings (place_id, customer_id, owner_id, check_in, check_out, status)
          VALUES (?, ?, ?, ?, ?, 'APPROVED')
        `;

        db.query(
          approveInsert,
          [place_id, req.user.id, owner_id, check_in, check_out],
          (err, result) => {
            if (err) {
              return db.rollback(() =>
                res.status(500).json({ message: "Booking failed" })
              );
            }

            db.commit((cErr) => {
              if (cErr) {
                return db.rollback(() =>
                  res.status(500).json({ message: "Commit failed" })
                );
              }

              return res.json({
                message: "Booking confirmed",
                status: "APPROVED",
                booking_id: result.insertId,
              });
            });
          }
        );
      });
    });
  });
});

/* =================================================
   2️⃣ OWNER – VIEW OWN BOOKINGS
   ================================================= */
router.get("/owner", verifyToken, verifyOwner, (req, res) => {
  const ownerId = req.user.id;

  const sql = `
    SELECT 
      b.id,
      p.name AS place_name,
      u.name AS customer_name,
      b.check_in,
      b.check_out,
      b.status,
      b.created_at
    FROM bookings b
    JOIN places p ON b.place_id = p.id
    JOIN users u ON b.customer_id = u.id
    WHERE b.owner_id = ?
    ORDER BY b.created_at DESC
  `;

  db.query(sql, [ownerId], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch bookings" });
    res.json(results);
  });
});

/* =================================================
   3️⃣ OWNER – APPROVE BOOKING (ONLY IF PENDING)
   ================================================= */
router.put("/:id/approve", verifyToken, verifyOwner, (req, res) => {
  const bookingId = req.params.id;
  const ownerId = req.user.id;

  const sql = `
    UPDATE bookings
    SET status = 'APPROVED'
    WHERE id = ? AND owner_id = ? AND status = 'PENDING'
  `;

  db.query(sql, [bookingId, ownerId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Booking cannot be approved (not pending or not allowed)",
      });
    }

    res.json({ message: "Booking approved" });
  });
});

/* =================================================
   4️⃣ OWNER – REJECT BOOKING (ONLY IF PENDING)
   ================================================= */
router.put("/:id/reject", verifyToken, verifyOwner, (req, res) => {
  const bookingId = req.params.id;
  const ownerId = req.user.id;

  const sql = `
    UPDATE bookings
    SET status = 'REJECTED'
    WHERE id = ? AND owner_id = ? AND status = 'PENDING'
  `;

  db.query(sql, [bookingId, ownerId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Booking cannot be rejected (not pending or not allowed)",
      });
    }

    res.json({ message: "Booking rejected" });
  });
});

/* =================================================
   5️⃣ CUSTOMER – VIEW OWN BOOKINGS
   ================================================= */
router.get("/customer", verifyToken, (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Customers only" });
  }

  const customerId = req.user.id;

  const sql = `
    SELECT
      b.id,
      p.name AS place_name,
      b.check_in,
      b.check_out,
      b.status,
      b.created_at
    FROM bookings b
    JOIN places p ON b.place_id = p.id
    WHERE b.customer_id = ?
    ORDER BY b.created_at DESC
  `;

  db.query(sql, [customerId], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch bookings" });
    res.json(results);
  });
});

module.exports = router;