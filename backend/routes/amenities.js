const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all amenities
router.get("/", (req, res) => {
  const sql = "SELECT * FROM amenities";

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

module.exports = router;