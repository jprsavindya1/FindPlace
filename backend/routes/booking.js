const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, verifyOwner } = require("../middleware/authMiddleware");
const PDFDocument = require("pdfkit");

// ✅ TEMP CONFIRMATION (to ensure correct file is being loaded)
console.log("✅ NEW booking.js (UPGRADED) LOADED");

/* =================================================
   1️⃣ CREATE BOOKING (CUSTOMER ONLY) - PENDING
   ================================================= */
router.post("/", verifyToken, (req, res) => {
  const { 
    place_id, room_id, adults, children, check_in, check_out, 
    full_name, email, phone, identity, 
    payment_status, payment_method, transaction_id 
  } = req.body;

  // Role check
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Customers only" });
  }

  // Required fields check (expanded)
  if (!place_id || !room_id || !check_in || !check_out) {
    return res.status(400).json({ message: "Place, room, and dates are required" });
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

  const nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)));

  // Get a connection from the pool for transaction
  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error("❌ DB CONNECTION ERROR:", connErr);
      return res.status(500).json({ message: "Database connection failed" });
    }

    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release();
        console.error("❌ TRANSACTION START ERROR:", txErr);
        return res.status(500).json({ message: "Transaction start failed" });
      }

      // Lock place row and get room price
      const placeSql = `
        SELECT p.owner_id, r.price 
        FROM places p
        JOIN rooms r ON r.place_id = p.id
        WHERE p.id = ? AND r.id = ? AND p.status = 'approved' FOR UPDATE
      `;

      connection.query(placeSql, [place_id, room_id], (err, placeResult) => {
        if (err) {
          console.error("❌ PLACE QUERY ERROR:", err);
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ message: "Database error during place lookup" });
          });
        }

        if (placeResult.length === 0) {
          return connection.rollback(() => {
            connection.release();
            res.status(404).json({ message: "Place/Room not found or not approved" });
          });
        }

        const { owner_id, price } = placeResult[0];
        const total_price = nights * parseFloat(price);

        // Check overlapping bookings for same room
        const conflictSql = `
          SELECT id
          FROM bookings
          WHERE place_id = ? AND room_id = ?
            AND status IN ('CONFIRMED', 'PENDING')
            AND NOT (check_out <= ? OR check_in >= ?)
          LIMIT 1
          FOR UPDATE
        `;

        connection.query(conflictSql, [place_id, room_id, check_in, check_out], (err, conflicts) => {
          if (err) {
            console.error("❌ CONFLICT QUERY ERROR:", err);
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ message: "Database error during conflict check" });
            });
          }

          // Conflict -> auto reject
          if (conflicts.length > 0) {
            const rejectInsert = `
              INSERT INTO bookings (place_id, room_id, customer_id, owner_id, check_in, check_out, full_name, email, phone, identity, adults, children, total_price, status, payment_status, payment_method, transaction_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REJECTED', ?, ?, ?)
            `;

            return connection.query(rejectInsert, [place_id, room_id, req.user.id, owner_id, check_in, check_out, full_name, email, phone, identity, adults || 1, children || 0, total_price, payment_status || 'UNPAID', payment_method || null, transaction_id || null], (err, result) => {
              if (err) {
                console.error("❌ REJECT INSERT ERROR:", err);
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ message: "Booking rejection failed to record" });
                });
              }
              connection.commit((cErr) => {
                if (cErr) {
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ message: "Commit failed during rejection" });
                  });
                }
                connection.release();
                return res.status(409).json({ message: "Unavailable for selected dates", status: "REJECTED", booking_id: result.insertId });
              });
            });
          }

          // No conflict -> Insert as CONFIRMED directly
          const pendingInsert = `
            INSERT INTO bookings (place_id, room_id, customer_id, owner_id, check_in, check_out, full_name, email, phone, identity, adults, children, total_price, status, payment_status, payment_method, transaction_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?)
          `;

          connection.query(pendingInsert, [place_id, room_id, req.user.id, owner_id, check_in, check_out, full_name, email, phone, identity, adults || 1, children || 0, total_price, payment_status || 'UNPAID', payment_method || null, transaction_id || null], (err, result) => {
            if (err) {
              console.error("❌ INSERT BOOKING ERROR:", err);
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: "Booking confirmation failed" });
              });
            }
            connection.commit((cErr) => {
              if (cErr) {
                console.error("❌ COMMIT BOOKING ERROR:", cErr);
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ message: "Final commit failed" });
                });
              }
              connection.release();
              return res.status(201).json({ 
                message: "Booking confirmed successfully!", 
                status: "CONFIRMED", 
                booking_id: result.insertId, 
                order_id: `FP-STAY-${String(result.insertId).padStart(4, '0')}`,
                total_price, 
                payment_status: payment_status || 'UNPAID' 
              });
            });
          });
        });
      });
    });
  });
});

/* =================================================
   1.6️⃣ FETCH BOOKED COUNTS FOR ALL ROOMS (AVAILABILITY)
   ================================================= */
router.get("/place/:placeId/availability", (req, res) => {
  const { placeId } = req.params;
  const { check_in, check_out } = req.query;

  if (!check_in || !check_out) {
    return res.status(400).json({ message: "check_in and check_out are required" });
  }

  const sql = `
    SELECT room_id, COUNT(*) as booked_count
    FROM bookings
    WHERE place_id = ? 
      AND status IN ('CONFIRMED', 'PENDING')
      AND NOT (check_out <= ? OR check_in >= ?)
    GROUP BY room_id
  `;

  db.query(sql, [placeId, check_in, check_out], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch availability" });
    }
    // Return an object { room_id: booked_count }
    const availability = {};
    results.forEach(row => {
      availability[row.room_id] = row.booked_count;
    });
    res.json(availability);
  });
});

/* =================================================
   1.5️⃣ FETCH BOOKED DATES FOR A ROOM
   ================================================= */
router.get("/place/:placeId/room/:roomId/dates", (req, res) => {
  const { placeId, roomId } = req.params;

  const sql = `
    SELECT check_in, check_out
    FROM bookings
    WHERE place_id = ? AND room_id = ? 
      AND status IN ('CONFIRMED', 'PENDING')
      AND check_out >= CURRENT_DATE
  `;

  db.query(sql, [placeId, roomId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch dates" });
    }
    res.json(results);
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
      b.place_id,
      p.name AS place_name,
      r.name AS room_name,
      u.name AS customer_name,
      b.full_name,
      b.email,
      b.phone,
      b.identity,
      b.adults,
      b.children,
      b.total_price,
      b.check_in,
      b.check_out,
      b.status,
      b.created_at
    FROM bookings b
    JOIN places p ON b.place_id = p.id
    LEFT JOIN rooms r ON b.room_id = r.id
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
   3️⃣ OWNER – ACTION ENDPOINTS (Approve/Reject/Complete)
   ================================================= */
router.put("/:id/status", verifyToken, verifyOwner, (req, res) => {
  const bookingId = req.params.id;
  const ownerId = req.user.id;
  const { status } = req.body;

  if (!['CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return res.status(400).json({ message: "Invalid status update" });
  }

  let sql = `
    UPDATE bookings
    SET status = ?
    WHERE id = ? AND owner_id = ?
  `;
  
  // Rule: Can only approve/reject pending bookings
  if (status === 'CONFIRMED' || status === 'REJECTED') {
      sql += ` AND status = 'PENDING'`;
  }

  // Rule: Can only complete confirmed bookings
  if (status === 'COMPLETED') {
      sql += ` AND status = 'CONFIRMED'`;
  }

  db.query(sql, [status, bookingId, ownerId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Status update forbidden. Booking may not exist or cannot transition to this status.",
      });
    }

    res.json({ message: `Booking marked as ${status}`, status });
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
      r.name AS room_name,
      b.check_in,
      b.check_out,
      b.total_price,
      b.status,
      b.created_at,
      CONCAT('FP-STAY-', LPAD(b.id, 4, '0')) as order_id
    FROM bookings b
    JOIN places p ON b.place_id = p.id
    LEFT JOIN rooms r ON b.room_id = r.id
    WHERE b.customer_id = ?
    ORDER BY b.created_at DESC
  `;

  db.query(sql, [customerId], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch bookings" });
    res.json(results);
  });
});

/* =================================================
   6️⃣ GENERATE PDF INVOICE
   ================================================= */
router.get("/invoice/:id", verifyToken, (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  const sql = `
    SELECT 
      b.id,
      b.transaction_id,
      p.name AS place_name,
      r.name AS room_name,
      u.name AS customer_name,
      b.check_in,
      b.check_out,
      b.total_price,
      b.payment_status,
      b.status,
      CONCAT('FP-STAY-', LPAD(b.id, 4, '0')) as order_id
    FROM bookings b
    JOIN places p ON b.place_id = p.id
    LEFT JOIN rooms r ON b.room_id = r.id
    JOIN users u ON b.customer_id = u.id
    WHERE b.id = ? AND (b.customer_id = ? OR b.owner_id = ?)
  `;

  db.query(sql, [bookingId, userId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Booking not found" });

    const b = results[0];

    // Create PDF
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Invoice-FindPlace-${b.id}.pdf`);

    doc.pipe(res);

    // --- Background Decor ---
    doc.save();
    doc.fillColor("#006CE4").opacity(0.03);
    doc.moveTo(0, 0).lineTo(600, 0).bezierCurveTo(400, 100, 200, 0, 0, 120).fill();
    doc.restore();

    const left = 50;
    const right = 545;
    const center = 300;
    let y = 60;

    // --- Header ---
    doc.fillColor("#003580").fontSize(30).font("Helvetica-Bold").text("Find", left, y, { continued: true });
    doc.fillColor("#006CE4").text("Place");
    
    y += 35;
    doc.fillColor("#64748b").fontSize(12).font("Helvetica").text("PREMIUM BOOKING INVOICE", left, y);
    
    y += 35;
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(left, y).lineTo(right, y).stroke();

    // --- Blue Stripe ---
    y += 15;
    doc.rect(0, y, 600, 35).fill("#006CE4");
    y += 55;

    // --- Invoice Info (Orderly Columns) ---
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("INVOICE ID", left, y);
    doc.fillColor("#1e293b").fontSize(12).font("Helvetica-Bold").text(`INV-${String(b.id).padStart(5, '0')}`, left, y + 15);

    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("TRANSACTION ID", 320, y);
    doc.fillColor("#1e293b").fontSize(12).font("Helvetica-Bold").text(b.transaction_id || 'TXN-PENDING', 320, y + 15);

    y += 50;
    doc.strokeColor("#f1f5f9").lineWidth(1).moveTo(left, y).lineTo(right, y).stroke();

    // --- Customer & Stay Details (Clean Layout) ---
    y += 20;
    
    // Left Side: Customer
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("CUSTOMER", left, y);
    doc.fillColor("#1e293b").fontSize(12).font("Helvetica-Bold").text(b.customer_name, left, y + 15);
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text(req.user.email || 'customer@example.com', left, y + 32);

    // Right Side: Property
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("PROPERTY & ROOM", 320, y);
    doc.fillColor("#1e293b").fontSize(12).font("Helvetica-Bold").text(b.place_name, 320, y + 15);
    doc.fillColor("#64748b").fontSize(11).font("Helvetica").text(b.room_name || 'Standard Room', 320, y + 32);

    y += 70;
    doc.strokeColor("#f1f5f9").lineWidth(1).moveTo(left, y).lineTo(right, y).stroke();

    // --- Dates Section ---
    y += 20;
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("CHECK-IN", left, y);
    doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text(new Date(b.check_in).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), left, y + 15);

    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("CHECK-OUT", 320, y);
    doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text(new Date(b.check_out).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 320, y + 15);

    y += 50;

    // --- Table (Professional Spacing) ---
    doc.rect(left, y, right - left, 30).fill("#006CE4");
    doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold").text("DESCRIPTION", left + 15, y + 10);
    doc.text("AMOUNT", 450, y + 10);

    y += 30;
    doc.rect(left, y, right - left, 45).fill("#f8fafc");
    doc.fillColor("#1e293b").fontSize(11).font("Helvetica").text(`Booking Charges for ${b.room_name || 'Room'}`, left + 15, y + 15);
    doc.font("Helvetica-Bold").text(`Rs. ${b.total_price.toLocaleString()}.00`, 440, y + 15);

    y += 45;
    doc.rect(left, y, right - left, 45).fill("#ffffff");
    doc.fillColor("#003580").fontSize(13).font("Helvetica-Bold").text("TOTAL AMOUNT", left + 15, y + 15);
    doc.text(`Rs. ${b.total_price.toLocaleString()}.00`, 440, y + 15);

    y += 45;
    doc.rect(left, y, right - left, 40).fill("#f1f5f9");
    doc.fillColor("#64748b").fontSize(11).font("Helvetica").text("PAYMENT STATUS", left + 15, y + 13);
    const statusCol = b.payment_status === 'PAID' ? "#059669" : "#dc2626";
    doc.fillColor(statusCol).font("Helvetica-Bold").text(b.payment_status, 440, y + 13);

    // --- Footer (Strict Centering) ---
    const footerY = 750;
    doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(left, footerY - 20).lineTo(right, footerY - 20).stroke();
    
    doc.fillColor("#1e293b").fontSize(15).font("Helvetica-Bold").text("Thank you for choosing FindPlace ❤️", left, footerY, {
      width: right - left,
      align: 'center'
    });
    
    doc.fillColor("#94a3b8").fontSize(10).font("Helvetica").text("This is a system-generated invoice.", left, footerY + 25, {
      width: right - left,
      align: 'center'
    });

    // Decorative Bottom Decor
    doc.save();
    doc.translate(0, 842);
    doc.fillColor("#006CE4").opacity(0.03);
    doc.moveTo(0, 0).lineTo(600, 0).bezierCurveTo(400, -100, 200, 0, 0, -120).fill();
    doc.restore();

    doc.end();
  });
});

module.exports = router;