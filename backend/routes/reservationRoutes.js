const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

/* ================= CREATE RESERVATION (PRO VERSION) ================= */
router.post("/", verifyToken, async (req, res) => {
  const { place_id, customer_name, customer_email, res_date, res_time, people_count, table_id, phone, special_requests, food_order_items } = req.body;
  const userId = req.user.id;
  const DURATION_MINUTES = 120;

  // Use a transaction to ensure atomic allocation
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: "Database connection failed" });

    connection.beginTransaction(async (err) => {
      if (err) { connection.release(); return res.status(500).json({ message: "Transaction failed" }); }

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
              if (err) return reject(err);
              resolve(results.length === 0);
            });
          });
        };

        if (table_id) {
          // Check specific table
          const isAvailable = await checkAvailability(table_id);
          if (!isAvailable) {
            connection.rollback(() => connection.release());
            return res.status(400).json({ message: "This table is already booked for the selected time. Please try another slot or table." });
          }
        } else {
          // Smart Allocation: Find best fit
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
                if (err) return reject(err);
                resolve(results.length > 0 ? results[0].id : null);
              });
            });
          };

          final_table_id = await findBestTable();
          if (!final_table_id) {
            connection.rollback(() => connection.release());
            return res.status(400).json({ message: "No tables available for this party size at the selected time. Please try a different time." });
          }
        }

        // 2. Insert the reservation
        const insertSql = `
          INSERT INTO reservations 
          (place_id, user_id, customer_name, customer_email, res_date, res_time, people_count, table_id, status, food_order_items)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
        `;
        const values = [place_id, userId, customer_name, customer_email, res_date, res_time, people_count, final_table_id, food_order_items || null];

        connection.query(insertSql, values, (err, result) => {
          if (err) {
            return connection.rollback(() => {
              console.error(err);
              connection.release();
              res.status(500).json({ message: "Reservation insertion failed" });
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ message: "Commit failed" });
              });
            }
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
           CONCAT('FP-DINE-', LPAD(r.id, 4, '0')) as order_id
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

module.exports = router;
