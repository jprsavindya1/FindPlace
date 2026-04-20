const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

/* ================= ADD TABLE ================= */
router.post("/", verifyToken, (req, res) => {
  const { 
    place_id, table_no, capacity, location_area, table_type, 
    min_capacity, is_smoking, is_combineable,
    pos_x, pos_y, width, height, shape, min_spend
  } = req.body;

  const sql = `
    INSERT INTO restaurant_tables 
    (place_id, table_no, capacity, location_area, table_type, min_capacity, is_smoking, is_combineable, pos_x, pos_y, width, height, shape, min_spend)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
      place_id, table_no, capacity, 
      location_area || 'Indoor', table_type || 'Standard', 
      min_capacity || 1, is_smoking ? 1 : 0, is_combineable ? 1 : 0,
      pos_x || 0, pos_y || 0, width || 1, height || 1, shape || 'rect', min_spend || 0
  ], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to add table" });
    }
    res.json({ message: "Table added", id: result.insertId });
  });
});

/* ================= GET TABLES BY PLACE ================= */
router.get("/place/:placeId", (req, res) => {
  const sql = `
    SELECT * FROM restaurant_tables 
    WHERE place_id = ? 
    ORDER BY table_no ASC
  `;

  db.query(sql, [req.params.placeId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch tables" });
    }
    res.json(results);
  });
});

/* ================= UPDATE TABLE STATUS ================= */
router.put("/:id", verifyToken, (req, res) => {
  const { 
    table_no, capacity, status, location_area, table_type, 
    min_capacity, is_smoking, is_combineable,
    pos_x, pos_y, width, height, shape, min_spend
  } = req.body;

  // We check if only status is being toggled from the grid view, in which case we only update status
  if (Object.keys(req.body).length === 1 && req.body.status) {
    const statusSql = `UPDATE restaurant_tables SET status = ? WHERE id = ?`;
    db.query(statusSql, [status, req.params.id], (err) => {
      if (err) return res.status(500).json({ message: "Status update failed" });
      return res.json({ message: "Table status updated" });
    });
    return;
  }

  const sql = `
    UPDATE restaurant_tables 
    SET table_no = ?, capacity = ?, status = ?, location_area = ?, table_type = ?, 
        min_capacity = ?, is_smoking = ?, is_combineable = ?,
        pos_x = ?, pos_y = ?, width = ?, height = ?, shape = ?, min_spend = ?
    WHERE id = ?
  `;

  db.query(sql, [
      table_no, capacity, status,
      location_area || 'Indoor', table_type || 'Standard',
      min_capacity || 1, is_smoking ? 1 : 0, is_combineable ? 1 : 0,
      pos_x, pos_y, width, height, shape, min_spend,
      req.params.id
  ], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Update failed" });
    }
    res.json({ message: "Table updated" });
  });
});

/* ================= BULK SYNC LAYOUT (TRANSACTIONAL) ================= */
router.put("/bulk/layout", verifyToken, async (req, res) => {
  const { place_id, tables } = req.body; 

  if (!place_id || !Array.isArray(tables)) {
    return res.status(400).json({ message: "Invalid request data. place_id and tables array are required." });
  }

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ message: "DB Connection failed" });

    connection.beginTransaction(async (startErr) => {
      if (startErr) {
        connection.release();
        return res.status(500).json({ message: "Transaction start failed" });
      }

      try {
        console.log("Starting bulk sync for place_id:", place_id, "Tables count:", tables.length);

        // 1. Identify which tables to keep (existing ones with numeric IDs)
        const incomingIds = tables
          .filter(t => t.id && !String(t.id).startsWith('new-'))
          .map(t => parseInt(t.id))
          .filter(id => !isNaN(id));

        console.log("Identified existing table IDs to keep:", incomingIds);

        // 2. Clear out tables that were removed in the UI
        if (incomingIds.length > 0) {
          await new Promise((resolve, reject) => {
            connection.query(
              "DELETE FROM restaurant_tables WHERE place_id = ? AND id NOT IN (?)",
              [place_id, incomingIds],
              (err) => err ? reject(err) : resolve()
            );
          });
        } else {
          console.log("No existing tables kept, clearing all tables for place_id:", place_id);
          await new Promise((resolve, reject) => {
            connection.query(
              "DELETE FROM restaurant_tables WHERE place_id = ?",
              [place_id],
              (err) => err ? reject(err) : resolve()
            );
          });
        }

        // 3. Process each table (Insert new ones, Update existing ones)
        for (const table of tables) {
          const { 
            id, table_no, capacity, pos_x, pos_y, width, height, shape, table_type, min_spend 
          } = table;

          // Convert to safe integers for DB
          const safePX = Math.round(parseFloat(pos_x) || 0);
          const safePY = Math.round(parseFloat(pos_y) || 0);
          const safeW = Math.round(parseFloat(width) || 5);
          const safeH = Math.round(parseFloat(height) || 5);

          if (!id || String(id).startsWith('new-')) {
            console.log("Inserting new table:", table_no);
            const insertSql = `
              INSERT INTO restaurant_tables 
              (place_id, table_no, capacity, pos_x, pos_y, width, height, shape, table_type, min_spend)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await new Promise((resolve, reject) => {
              connection.query(insertSql, [
                place_id, table_no, capacity, safePX, safePY, safeW, safeH, shape || 'rect', 
                table_type || 'Standard', min_spend || 0
              ], (err) => err ? reject(err) : resolve());
            });
          } else {
            console.log("Updating existing table ID:", id);
            const updateSql = `
              UPDATE restaurant_tables 
              SET table_no = ?, capacity = ?, pos_x = ?, pos_y = ?, width = ?, height = ?, shape = ?, table_type = ?, min_spend = ?
              WHERE id = ? AND place_id = ?
            `;
            await new Promise((resolve, reject) => {
              connection.query(updateSql, [
                table_no, capacity, safePX, safePY, safeW, safeH, shape, 
                table_type, min_spend, id, place_id
              ], (err) => err ? reject(err) : resolve());
            });
          }
        }

        connection.commit(commitErr => {
          if (commitErr) {
            console.error("COMMIT Error:", commitErr);
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ message: "Commit failed", error: commitErr.message });
            });
          }
          connection.release();
          res.json({ message: "Floor plan synchronized successfully! ✨" });
        });

      } catch (error) {
        console.error("CRITICAL Sync Error:", error);
        connection.rollback(() => {
          connection.release();
          res.status(500).json({ message: "Sync failed", error: error.message });
        });
      }
    });
  });
});

/* ================= DELETE TABLE ================= */
router.delete("/:id", verifyToken, (req, res) => {
  const sql = "DELETE FROM restaurant_tables WHERE id = ?";
  db.query(sql, [req.params.id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Delete failed" });
    }
    res.json({ message: "Table deleted" });
  });
});

module.exports = router;
