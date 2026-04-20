const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, verifyOwnerOrAdmin } = require("../middleware/authMiddleware");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

// ✅ TEMP CONFIRMATION (to ensure correct file is being loaded)
console.log("✅ NEW booking.js (UPGRADED) LOADED");

/* =================================================
   1️⃣ CREATE BOOKING (CUSTOMER ONLY) - PENDING
   ================================================= */
router.post("/", verifyToken, (req, res) => {
  const { 
    place_id, room_id, adults, children, num_rooms, check_in, check_out, 
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
        const total_price = nights * parseFloat(price) * (num_rooms || 1);

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
              INSERT INTO bookings (place_id, room_id, customer_id, owner_id, check_in, check_out, full_name, email, phone, identity, adults, children, num_rooms, total_price, status, payment_status, payment_method, transaction_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REJECTED', ?, ?, ?)
            `;

            return connection.query(rejectInsert, [place_id, room_id, req.user.id, owner_id, check_in, check_out, full_name, email, phone, identity, adults || 1, children || 0, num_rooms || 1, total_price, payment_status || 'UNPAID', payment_method || null, transaction_id || null], (err, result) => {
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
            INSERT INTO bookings (place_id, room_id, customer_id, owner_id, check_in, check_out, full_name, email, phone, identity, adults, children, num_rooms, total_price, status, payment_status, payment_method, transaction_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?)
          `;

          connection.query(pendingInsert, [place_id, room_id, req.user.id, owner_id, check_in, check_out, full_name, email, phone, identity, adults || 1, children || 0, num_rooms || 1, total_price, payment_status || 'UNPAID', payment_method || null, transaction_id || null], (err, result) => {
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
                order_id: `FP-STAY-${result.insertId}`,
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
router.get("/owner", verifyToken, verifyOwnerOrAdmin, (req, res) => {
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
      b.num_rooms,
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
router.put("/:id/status", verifyToken, verifyOwnerOrAdmin, (req, res) => {
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
      b.adults,
      b.children,
      b.num_rooms,
      b.full_name,
      b.email,
      b.phone,
      CONCAT('FP-STAY-', b.id) as order_id
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
      b.*,
      p.name AS place_name,
      p.location AS place_location,
      r.name AS room_name,
      u.name AS customer_name,
      u.email AS user_email,
      CONCAT('FP-STAY-', b.id) as order_id
    FROM bookings b
    JOIN places p ON b.place_id = p.id
    LEFT JOIN rooms r ON b.room_id = r.id
    JOIN users u ON b.customer_id = u.id
    WHERE b.id = ? AND (b.customer_id = ? OR b.owner_id = ? OR ? = 'admin')
  `;

  const queryParams = [bookingId, userId, userId, req.user.role];

  console.log("🔍 RUNNING SYNCED SQL:", sql);
  console.log("📊 WITH PARAMS:", queryParams);

  db.query(sql, queryParams, async (err, results) => {
    if (err) {
      console.error("❌ SQL ERROR:", err);
      // Log to file for AI investigation
      const fs = require('fs');
      const errorMsg = `[${new Date().toISOString()}] SQL ERROR for /invoice/${bookingId}: ${err.message}\nSQL: ${sql}\nParams: ${JSON.stringify(queryParams)}\n\n`;
      fs.appendFileSync('sql_error_log.txt', errorMsg);
      return res.status(500).json({ message: "Database error" });
    }
    if (results.length === 0) return res.status(404).json({ message: "Booking not found" });

    const b = results[0];

    try {
      // Create PDF
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 0
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Luxury-Stay-Confirmation-${b.id}-Final.pdf`);
      doc.pipe(res);

      // --- COLORS & STYLES ---
      const colors = {
        bg: "#040b17",
        blue: "#3b82f6",
        white: "#ffffff",
        textGrey: "#aaaaaa",
        success: "#10b981"
      };

      // 1. Fill Dark Background
      doc.rect(0, 0, 595, 842).fill(colors.bg);

      // 2. Luxury Blue Border
      doc.rect(20, 20, 555, 802).lineWidth(2).strokeColor(colors.blue).stroke();

      let y = 60;

      // 3. Header
      y += 35;
      doc.fillColor(colors.blue).fontSize(42).text(b.place_name?.toUpperCase() || "FINDPLACE LUXURY", 0, y, { align: 'center', characterSpacing: 5 });
      y += 45;
      doc.fillColor(colors.white).fontSize(16).text("BOOKING CONFIRMATION & INVOICE", 0, y, { align: 'center', characterSpacing: 2 });
      y += 20;
      doc.rect(220, y, 155, 2).fill(colors.blue);

      // 4. QR Code Section (Digital Proof for Stays)
      y += 40;
      const orderIdString = `FP-STAY-${b.id}`; // Stay ID
      const qrData = JSON.stringify({ order_id: orderIdString, type: "stay", customer: b.customer_name, check_in: b.check_in });
      const qrBuffer = await QRCode.toBuffer(qrData, { 
        margin: 1, 
        width: 170,
        color: { dark: "#ffffff", light: "#040b17" } // White on Navy for stay theme
      });
      
      doc.image(qrBuffer, 212, y, { width: 170 });
      
      y += 180;
      doc.fillColor(colors.blue).fontSize(10).font("Helvetica-Bold").text("ORDER CONFIRMATION ID", 0, y, { align: 'center' });
      y += 15;
      doc.fillColor(colors.blue).fontSize(32).text(orderIdString, 0, y, { align: 'center' });

      // 5. Details Cards
      y += 45;
      const cardWidth = 230;
      const cardHeight = 50;
      const leftCol = 60;
      const rightCol = 305;

      const drawCard = (x, y, label, value, color) => {
        doc.roundedRect(x, y, cardWidth, cardHeight, 10).strokeColor(colors.blue).lineWidth(1).stroke();
        doc.fillColor(colors.blue).fontSize(8).font("Helvetica-Bold").text(label, x + 15, y + 12);
        doc.fillColor(color || colors.white).fontSize(12).text(value || 'N/A', x + 15, y + 26);
      };

      drawCard(leftCol, y, "PROPERTY", b.place_name);
      drawCard(rightCol, y, "ROOM TYPE", b.room_name || "Accommodation", colors.white);
      
      y += 60;
      drawCard(leftCol, y, "CHECK-IN", new Date(b.check_in).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
      drawCard(rightCol, y, "CHECK-OUT", new Date(b.check_out).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));

      y += 60;
      drawCard(leftCol, y, "GUEST NAME", b.customer_name);
      drawCard(rightCol, y, "STAY DURATION", `${Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / (1000 * 60 * 60 * 24))} Night(s)`);

      y += 60;
      const statusColor = b.payment_status?.toUpperCase() === 'PAID' ? colors.success : "#ff4d4d";
      drawCard(leftCol, y, "GUESTS", `${b.adults} Adults, ${b.children} Children`);
      drawCard(rightCol, y, "PAYMENT STATUS", b.payment_status?.toUpperCase() || "PENDING", statusColor);

      y += 60;
      drawCard(leftCol, y, "TOTAL PAYMENT", `Rs. ${Number(b.total_price).toLocaleString()}`, colors.success);

      // 6. Footer Badge
      const footerY = 760;
      doc.roundedRect(247, footerY, 100, 30, 15).fill(colors.blue);
      doc.fillColor(colors.bg).fontSize(14).font("Times-Bold").text("WELCOME", 247, footerY + 8, { width: 100, align: 'center' });
      
      doc.fillColor(colors.blue).fontSize(8).font("Helvetica").text("THANK YOU FOR BOOKING WITH FINDPLACE.COM", 0, 805, { align: 'center' });

      doc.end();
    } catch (err) {
      console.error("Stay PDF Generation Error:", err);
      res.status(500).json({ message: "PDF generation failed" });
    }
  });
});

module.exports = router;