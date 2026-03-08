const express = require("express");
const router = express.Router();
const db = require("../db");
const {
  verifyToken,
  verifyOwner,
} = require("../middleware/authMiddleware");

/* ================= MULTER IMPORTS ================= */
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ================= MULTER STORAGE CONFIG ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      "place-" +
        req.params.id +
        "-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

/* ======================================================
   OWNER – ADD NEW PLACE
====================================================== */
router.post("/places", verifyToken, verifyOwner, (req, res) => {
  const {
    name,
    location,
    price,
    category,
    province,
    district,
    area,
    keywords,
  } = req.body;

  const sql = `
    INSERT INTO places 
    (owner_id, name, location, price, category, province, district, area, keywords, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const values = [
    req.user.id,
    name,
    location,
    price,
    category,
    province,
    district,
    area,
    keywords,
  ];

  db.query(sql, values, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Place add failed" });
    }

    res.json({ message: "Place added successfully (Pending approval)" });
  });
});

/* ======================================================
   OWNER – EDIT OWN PLACE
====================================================== */
router.put("/places/:id", verifyToken, verifyOwner, (req, res) => {
  const placeId = req.params.id;
  const ownerId = req.user.id;

  const {
    name,
    location,
    price,
    category,
    province,
    district,
    area,
    keywords,
  } = req.body;

  const sql = `
    UPDATE places
    SET name=?, location=?, price=?, category=?, province=?, district=?, area=?, keywords=?
    WHERE id=? AND owner_id=?
  `;

  const values = [
    name,
    location,
    price,
    category,
    province,
    district,
    area,
    keywords,
    placeId,
    ownerId,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Place update failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: "Not your place" });
    }

    res.json({ message: "Place updated successfully" });
  });
});

/* ======================================================
   OWNER – GET OWN PLACES
====================================================== */
router.get("/places", verifyToken, verifyOwner, (req, res) => {
  const sql = "SELECT * FROM places WHERE owner_id = ? ORDER BY id DESC";

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch places" });
    }

    res.json(results);
  });
});

/* ======================================================
   OWNER – DELETE OWN PLACE
====================================================== */
router.delete("/places/:id", verifyToken, verifyOwner, (req, res) => {
  const placeId = req.params.id;
  const ownerId = req.user.id;

  const sql = `
    DELETE FROM places
    WHERE id = ? AND owner_id = ?
  `;

  db.query(sql, [placeId, ownerId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Delete failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: "Not your place" });
    }

    res.json({ message: "Place deleted successfully" });
  });
});

/* ======================================================
   OWNER – UPLOAD / UPDATE OWN PLACE IMAGE
====================================================== */
router.put(
  "/places/:id/image",
  verifyToken,
  verifyOwner,
  upload.single("image"),
  (req, res) => {
    const placeId = req.params.id;
    const ownerId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const newImage = req.file.filename;

    // check ownership + get old image
    db.query(
      "SELECT image FROM places WHERE id = ? AND owner_id = ?",
      [placeId, ownerId],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
          return res.status(403).json({ message: "Not your place" });
        }

        const oldImage = results[0].image;

        // update image
        db.query(
          "UPDATE places SET image = ? WHERE id = ?",
          [newImage, placeId],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Image update failed" });
            }

            // delete old image if exists
            if (oldImage) {
              const oldPath = path.join("uploads", oldImage);
              if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
              }
            }

            res.json({
              message: "Image uploaded successfully",
              image: newImage,
            });
          }
        );
      }
    );
  }
);

module.exports = router;
