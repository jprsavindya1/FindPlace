const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

/* ================= ADD TABLE ================= */
router.post("/", verifyToken, (req, res) => {
  const { place_id, table_no, capacity, location_area, table_type, min_capacity, is_smoking, is_combineable } = req.body;

  const sql = `
    INSERT INTO restaurant_tables 
    (place_id, table_no, capacity, location_area, table_type, min_capacity, is_smoking, is_combineable)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
      place_id, table_no, capacity, 
      location_area || 'Indoor', table_type || 'Standard', 
      min_capacity || 1, is_smoking ? 1 : 0, is_combineable ? 1 : 0
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
  const { table_no, capacity, status, location_area, table_type, min_capacity, is_smoking, is_combineable } = req.body;

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
    SET table_no = ?, capacity = ?, status = ?, location_area = ?, table_type = ?, min_capacity = ?, is_smoking = ?, is_combineable = ?
    WHERE id = ?
  `;

  db.query(sql, [
      table_no, capacity, status,
      location_area || 'Indoor', table_type || 'Standard',
      min_capacity || 1, is_smoking ? 1 : 0, is_combineable ? 1 : 0,
      req.params.id
  ], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Update failed" });
    }
    res.json({ message: "Table updated" });
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
