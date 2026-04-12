const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
console.log("🚀 RESERVATION SYSTEM V3 (FIXED) LOADED");

/* ================= CREATE RESERVATION (PRO VERSION) ================= */
router.post("/", verifyToken, async (req, res) => {
  const { place_id, customer_name, customer_email, res_date, res_time, people_count, table_id, phone, customer_phone, special_requests, food_order_items } = req.body;
  const userId = req.user.id;
  const DURATION_MINUTES = 120;
  
  const finalPhone = customer_phone || phone;

  console.log("➡️  RESERVATION ATTEMPT DATA:", { 
    place_id, 
    customer_name, 
    res_date, 
    res_time, 
    people_count, 
    table_id, 
    table_id_type: typeof table_id,
    food_order_items 
  });

  // Use a transaction to ensure atomic allocation
  db.getConnection((err, connection) => {
    if (err) {
      console.error("❌ DB CONNECTION FAILED:", err);
      return res.status(500).json({ message: "Database connection failed" });
    }
    console.log("✅ Connection acquired for transaction");

    connection.beginTransaction(async (err) => {
      if (err) {
        console.error("❌ TRANSACTION START FAILED:", err);
        connection.release(); 
        return res.status(500).json({ message: "Transaction failed" }); 
      }
      console.log("✅ Transaction started");

      try {
        let final_table_id = table_id;

        // 1. Availability check logic
        const checkAvailability = (tid) => {
          return new Promise((resolve, reject) => {
            const sql = `
              SELECT id FROM reservations 
              WHERE table_id = ? AND res_date = ? 
              AND status = 'confirmed'
              AND (
                (res_time <= ? AND ADDTIME(res_time, '02:00:00') > ?) OR
                (res_time < ADDTIME(?, '02:00:00') AND ADDTIME(res_time, '02:00:00') >= ADDTIME(?, '02:00:00')) OR
                (? >= res_time AND ? < ADDTIME(res_time, '02:00:00'))
              )
            `;
            // Simplified overlap: (start1 < end2) AND (end1 > start2)
            const overlapSql = `
              SELECT id FROM reservations 
              WHERE table_id = ? AND res_date = ? 
              AND status = 'confirmed'
              AND res_time < ADDTIME(?, '02:00:00') 
              AND ADDTIME(res_time, '02:00:00') > ?
            `;
            connection.query(overlapSql, [tid, res_date, res_time, res_time], (err, results) => {
              if (err) {
                console.error("❌ Availability Check SQL Error:", err);
                return reject(err);
              }
              resolve(results.length === 0);
            });
          });
        };

        // 1. Availability check logic - Explicit ID must be a positive number/string
        const hasExplicitTable = table_id && String(table_id).trim() !== "" && !isNaN(table_id);

        if (hasExplicitTable) {
          console.log("STEP 1: Checking specific Table ID:", table_id);
          const isAvailable = await checkAvailability(table_id);
          if (!isAvailable) {
            console.log("❌ Table busy for ID:", table_id);
            connection.rollback(() => connection.release());
            return res.status(400).json({ message: "This table is already booked for the selected time." });
          }
        } else {
          console.log("STEP 1B: Smart Table Allocation (No table_id provided)");
          const findBestTable = () => {
            return new Promise((resolve, reject) => {
              const sql = `
                SELECT id, capacity FROM restaurant_tables 
                WHERE place_id = ? AND capacity >= ? AND status = 'available'
                AND id NOT IN (
                  SELECT table_id FROM reservations 
                  WHERE res_date = ? AND status = 'confirmed'
                  AND res_time < ADDTIME(?, '02:00:00') 
                  AND ADDTIME(res_time, '02:00:00') > ?
                )
                ORDER BY capacity ASC
                LIMIT 1
              `;
              connection.query(sql, [place_id, people_count, res_date, res_time, res_time], (err, results) => {
                if (err) {
                  console.error("❌ Smart Allocation SQL Error:", err);
                  return reject(err);
                }
                resolve(results.length > 0 ? results[0].id : null);
              });
            });
          };

          final_table_id = await findBestTable();
          if (!final_table_id) {
            console.log("❌ No tables available");
            connection.rollback(() => connection.release());
            return res.status(400).json({ message: "No tables available." });
          }
        }

        // 2. Calculate total_price from food_order_items if present
        console.log("STEP 2: Menu Price Fetching");
        let total_price = 0;
        let finalItemsArray = [];

        if (food_order_items) {
          try {
            const itemsObj = typeof food_order_items === 'string' ? JSON.parse(food_order_items) : food_order_items;
            const itemIds = Object.keys(itemsObj);
            console.log("🔍 Pre-order item IDs:", itemIds);
            
            if (itemIds.length > 0) {
              const fetchItemPrices = () => {
                return new Promise((resolve, reject) => {
                  console.log("🔍 Executing item prices query...");
                  connection.query(
                    'SELECT id, name, price FROM menu WHERE id IN (?)', 
                    [itemIds], 
                    (err, menuResults) => {
                      if (err) {
                        console.error("❌ fetchItemPrices SQL Error:", err);
                        return reject(err);
                      }
                      console.log("✅ fetchItemPrices results count:", menuResults.length);
                      resolve(menuResults);
                    }
                  );
                });
              };
              
              const menuDetails = await fetchItemPrices();
              menuDetails.forEach(item => {
                const qty = itemsObj[String(item.id)] || 0;
                total_price += Number(item.price) * qty;
                finalItemsArray.push({ id: item.id, name: item.name, price: item.price, quantity: qty });
              });
              console.log("💰 Calculated Total Price:", total_price);
            }
          } catch (e) {
            console.error("❌ STEP 2 FAILED:", e);
            throw e;
          }
        }

        // 3. Insert the reservation
        console.log("STEP 3: Database Insert");
        const insertSql = `
          INSERT INTO reservations 
          (place_id, user_id, customer_name, customer_email, customer_phone, res_date, res_time, people_count, table_id, status, food_order_items, total_price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
        `;
        const values = [
          place_id, userId, customer_name, customer_email, finalPhone, 
          res_date, res_time, people_count, final_table_id, 
          JSON.stringify(finalItemsArray), total_price
        ];

        connection.query(insertSql, values, (err, result) => {
          if (err) {
            console.error("❌ STEP 3 SQL ERROR:", err);
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ message: "Reservation insertion failed" });
            });
          }
          console.log("✅ Reservation inserted, ID:", result.insertId);

          console.log("STEP 4: Commit Transaction");
          connection.commit((err) => {
            if (err) {
              console.error("❌ COMMIT FAILED:", err);
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: "Commit failed" });
              });
            }
            console.log("🎉 ALL STEPS COMPLETED SUCCESSFULLY");
            connection.release();
            res.json({ 
              message: "Table Reserved & Confirmed! 🎉", 
              id: result.insertId,
              order_id: `FP-DINE-${String(result.insertId).padStart(4, '0')}`,
              status: 'confirmed',
              table_id: final_table_id
            });
          });
        });

      } catch (error) {
        console.error("❌ RESERVATION ERROR:", error);
        connection.rollback(() => connection.release());
        res.status(500).json({ message: "An error occurred during booking." });
      }
    });
  });
});

/* ================= GET RESERVATIONS FOR OWNER ================= */
router.get("/owner/all", verifyToken, (req, res) => {
  const { placeId } = req.query;
  const ownerId = req.user.id;

  let sql = `
    SELECT r.*, rt.table_no, p.name as place_name,
           CONCAT('FP-DINE-', LPAD(r.id, 4, '0')) as order_id,
           r.total_price as total_price
    FROM reservations r
    LEFT JOIN restaurant_tables rt ON r.table_id = rt.id
    JOIN places p ON r.place_id = p.id
    WHERE p.owner_id = ?
  `;
  const params = [ownerId];

  if (placeId && placeId !== "ALL") {
    sql += " AND r.place_id = ?";
    params.push(placeId);
  }

  sql += " ORDER BY r.id DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch reservations" });
    }
    res.json(results);
  });
});
/* ================= GET RESERVATIONS FOR CUSTOMER ================= */
router.get("/customer", verifyToken, (req, res) => {
  const customerId = req.user.id;

  const sql = `
    SELECT r.*, p.name as place_name, rt.table_no,
           CONCAT('FP-DINE-', LPAD(r.id, 4, '0')) as order_id
    FROM reservations r
    JOIN places p ON r.place_id = p.id
    LEFT JOIN restaurant_tables rt ON r.table_id = rt.id
    WHERE r.user_id = ?
    ORDER BY r.id DESC
  `;

  db.query(sql, [customerId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch reservations" });
    }
    res.json(results);
  });
});
/* ================= UPDATE RESERVATION STATUS ================= */
router.put("/:id/status", verifyToken, (req, res) => {
  const { status, table_id } = req.body;

  let sql = "UPDATE reservations SET status = ?";
  const params = [status];

  if (table_id) {
    sql += ", table_id = ?";
    params.push(table_id);
  }

  sql += " WHERE id = ?";
  params.push(req.params.id);

  db.query(sql, params, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Status update failed" });
    }
    res.json({ message: `Reservation marked as ${status}` });
  });
});

/* ================= GENERATE DINING INVOICE (PDF) ================= */
router.get("/invoice/:id", verifyToken, (req, res) => {
  const reservationId = req.params.id;
  const userId = req.user.id;

  const sql = `
    SELECT 
      r.*, 
      p.name AS place_name, 
      p.location,
      rt.table_no,
      u.email AS user_email,
      CONCAT('FP-DINE-', LPAD(r.id, 4, '0')) as order_id
    FROM reservations r
    JOIN places p ON r.place_id = p.id
    LEFT JOIN restaurant_tables rt ON r.table_id = rt.id
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ? AND (r.user_id = ? OR p.owner_id = ?)
  `;

  db.query(sql, [reservationId, userId, userId], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Reservation not found" });

    const b = results[0];

    try {
      // Create PDF
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 0 // We'll handle our own margins for the luxury border
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Official-Confirmation-${b.order_id}-v4.pdf`);
      doc.pipe(res);

      // --- COLORS & STYLES ---
      const colors = {
        bg: "#121212",
        gold: "#d4af37",
        white: "#ffffff",
        textGrey: "#aaaaaa",
        cardBg: "rgba(255,255,255,0.03)",
        success: "#10b981"
      };

      // 1. Fill Dark Background
      doc.rect(0, 0, 595, 842).fill(colors.bg);

      // 2. Double Gold Border
      doc.rect(20, 20, 555, 802).lineWidth(1).strokeColor(colors.gold).stroke();
      doc.rect(25, 25, 545, 792).lineWidth(2).strokeColor(colors.gold).stroke();

      let y = 60;

      // 3. Header Name
      y += 30;
      doc.fillColor(colors.gold).fontSize(42).text(b.place_name?.toUpperCase() || "THE GOLDEN SPOON", 0, y, { align: 'center', characterSpacing: 5 });
      y += 45;
      doc.fillColor(colors.white).fontSize(16).text("BOOKING CONFIRMATION & INVOICE", 0, y, { align: 'center', characterSpacing: 2 });
      y += 20;
      doc.rect(220, y, 155, 2).fill(colors.gold);

      // 4. QR Code Section (Digital Proof)
      y += 40;
      const qrData = JSON.stringify({ order_id: b.order_id, type: "dining", customer: b.customer_name, date: b.res_date });
      const qrBuffer = await QRCode.toBuffer(qrData, { 
        margin: 2, 
        width: 150,
        color: { dark: "#000000", light: "#ffffff" }
      });
      
      // Draw white background for QR
      doc.roundedRect(222, y, 150, 150, 10).fill(colors.white);
      doc.image(qrBuffer, 222, y, { width: 150 });
      
      y += 170;
      doc.fillColor(colors.gold).fontSize(10).font("Helvetica-Bold").text("ORDER CONFIRMATION ID", 0, y, { align: 'center' });
      y += 15;
      doc.fillColor(colors.gold).fontSize(32).text(b.order_id, 0, y, { align: 'center' });

      // 5. Details Cards (Replicating the frontend grid)
      y += 50;
      const cardWidth = 230;
      const cardHeight = 50;
      const leftCol = 60;
      const rightCol = 305;

      const drawCard = (x, y, label, value, color) => {
        doc.roundedRect(x, y, cardWidth, cardHeight, 10).strokeColor(colors.gold).lineWidth(1).stroke();
        doc.fillColor(colors.gold).fontSize(8).font("Helvetica-Bold").text(label, x + 15, y + 12);
        doc.fillColor(color || colors.white).fontSize(12).text(value || 'N/A', x + 15, y + 26);
      };

      drawCard(leftCol, y, "PROPERTY", b.place_name);
      drawCard(rightCol, y, "BOOKING TYPE", "Dining Reservation", colors.gold);
      
      y += 60;
      drawCard(leftCol, y, "RESERVATION DATE", new Date(b.res_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
      drawCard(rightCol, y, "ARRIVAL TIME", b.res_time?.slice(0, 5) || "N/A");

      y += 60;
      drawCard(leftCol, y, "GUEST NAME", b.customer_name);
      drawCard(rightCol, y, "CONTACT DETAIL", b.customer_phone || b.phone || 'N/A');

      y += 60;
      drawCard(leftCol, y, "GUEST COUNT", `${b.people_count} People`);
      drawCard(rightCol, y, "TOTAL PAYMENT", `Rs. ${Number(b.total_price).toLocaleString()}`, colors.success);

      // 6. Itemized Food Table (Premium Style)
      if (b.food_order_items) {
          const items = JSON.parse(b.food_order_items);
          if (items && items.length > 0) {
              y += 75;
              doc.rect(60, y, 475, 1).fill(colors.gold);
              y += 15;
              doc.fillColor(colors.gold).fontSize(10).font("Times-Bold").text("PRE-ORDERED DISHES", 60, y);
              y += 20;

              items.forEach(item => {
                  doc.fillColor(colors.white).fontSize(10).font("Helvetica").text(`${item.quantity}x ${item.name}`, 60, y);
                  doc.fillColor(colors.gold).text(`Rs. ${(item.price * item.quantity).toLocaleString()}`, 450, y, { align: 'right', width: 85 });
                  y += 18;
              });
          }
      }

      // 7. Footer & Badge
      const footerY = 760;
      doc.roundedRect(247, footerY, 100, 30, 15).fill(colors.gold);
      doc.fillColor(colors.bg).fontSize(14).font("Times-Bold").text("WELCOME", 247, footerY + 8, { width: 100, align: 'center' });
      
      doc.fillColor(colors.gold).fontSize(8).font("Helvetica").text("THANK YOU FOR BOOKING WITH FINDPLACE.COM", 0, 805, { align: 'center' });

      doc.end();
    } catch (qrErr) {
      console.error("QR Generation Error:", qrErr);
      res.status(500).json({ message: "PDF generation failed" });
    }
  });
});

module.exports = router;
