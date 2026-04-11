const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

/* ================= NEW IMPORTS ================= */

const multer = require("multer");
const path = require("path");

/* ================= MULTER STORAGE CONFIG ================= */

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, "uploads/menu");
  },

  filename: function (req, file, cb) {

    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },

});

const upload = multer({ storage });

/* ================= ADD MENU ITEM ================= */

router.post("/", verifyToken, upload.single("image"), (req, res) => {

  const { place_id, name, description, price, category, is_veg, is_special, spicy_level, contains_alcohol, chefs_recommendation, prep_time, is_available } = req.body;

  const image = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO menu
    (place_id, name, description, price, category, image, is_veg, is_special, spicy_level, contains_alcohol, chefs_recommendation, prep_time, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      place_id, name, description, price, category, image,
      is_veg === 'true' || is_veg === true ? 1 : 0,
      is_special === 'true' || is_special === true ? 1 : 0,
      spicy_level || 'None',
      contains_alcohol === 'true' || contains_alcohol === true ? 1 : 0,
      chefs_recommendation === 'true' || chefs_recommendation === true ? 1 : 0,
      prep_time || '',
      is_available !== 'false' && is_available !== false ? 1 : 0
    ],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Menu add failed" });
      }

      res.json({ message: "Menu item added" });

    }
  );

});

/* ================= GET MENU BY PLACE ================= */

router.get("/place/:placeId", (req, res) => {

  const sql = `
    SELECT *
    FROM menu
    WHERE place_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [req.params.placeId], (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Menu fetch failed" });
    }

    res.json(results);

  });

});

/* ================= GET ALL MENU ITEMS FOR OWNER ================= */
router.get("/owner/all", verifyToken, (req, res) => {
  const ownerId = req.user.id;
  const sql = `
    SELECT m.* 
    FROM menu m
    JOIN places p ON m.place_id = p.id
    WHERE p.owner_id = ?
  `;
  db.query(sql, [ownerId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch owner menus" });
    }
    res.json(results);
  });
});

/* ================= UPDATE MENU ================= */

router.put("/:id", verifyToken, upload.single("image"), (req, res) => {
  const { name, description, price, category, is_veg, is_special, spicy_level, contains_alcohol, chefs_recommendation, prep_time, is_available } = req.body;
  const image = req.file ? req.file.filename : null;

  console.log("Update Menu Request Body:", req.body);
  console.log("Update Menu ID:", req.params.id);

  let sql = "UPDATE menu SET name = ?, description = ?, price = ?, category = ?, is_veg = ?, is_special = ?, spicy_level = ?, contains_alcohol = ?, chefs_recommendation = ?, prep_time = ?, is_available = ?";
  let params = [
    name, description, price, category,
    is_veg === 'true' || is_veg === true ? 1 : 0,
    is_special === 'true' || is_special === true ? 1 : 0,
    spicy_level || 'None',
    contains_alcohol === 'true' || contains_alcohol === true ? 1 : 0,
    chefs_recommendation === 'true' || chefs_recommendation === true ? 1 : 0,
    prep_time || '',
    is_available !== 'false' && is_available !== false ? 1 : 0
  ];

  if (image) {
    sql += ", image = ?";
    params.push(image);
  }

  sql += " WHERE id = ?";
  params.push(req.params.id);

  db.query(sql, params, (err) => {
    if (err) {
      console.error("❌ SQL Update Failed:", err);
      return res.status(500).json({ 
        message: "Update failed", 
        error: err.sqlMessage || err.message 
      });
    }
    res.json({ message: "Menu updated" });
  });
});

/* ================= DELETE MENU ================= */

router.delete("/:id", verifyToken, (req, res) => {
  const sql = "DELETE FROM menu WHERE id = ?";
  db.query(sql, [req.params.id], (err) => {
    if (err) {
      console.error("❌ SQL Delete Failed:", err);
      return res.status(500).json({ message: "Delete failed" });
    }
    res.json({ message: "Menu item deleted" });
  });
});

module.exports = router;