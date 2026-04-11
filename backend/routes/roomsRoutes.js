const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ================= MULTER STORAGE CONFIG ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/rooms");
  },
  filename: (req, file, cb) => {
    const prefix = file.fieldname === "image_360" ? "room360" : "room";
    cb(
      null,
      prefix + "-" +
        (req.params.id || "new") +
        "-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

/* ===============================
   ADD ROOM TYPE
================================ */

router.post("/", upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'image_360', maxCount: 1 }
]), (req, res) => {
    const { place_id, name, price, total_rooms, capacity, description } = req.body;
    const image = req.files["image"] ? req.files["image"][0].filename : null;
    const image_360 = req.files["image_360"] ? req.files["image_360"][0].filename : null;

    const sql = `
      INSERT INTO rooms (place_id, name, price, total_rooms, capacity, description, image, image_360)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [place_id, name, price, total_rooms || 1, capacity || 0, description, image, image_360],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        res.json({
          message: "Room type added successfully",
          id: result.insertId,
          image: image,
          image_360: image_360
        });
      }
    );
  });


/* ===============================
   GET ROOMS BY PLACE
================================ */

router.get("/place/:id", (req, res) => {

  const placeId = req.params.id;

  const sql = `
    SELECT * FROM rooms
    WHERE place_id = ?
    ORDER BY price ASC
  `;

  db.query(sql, [placeId], (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);

  });

});


/* ===============================
   UPDATE ROOM
================================ */

router.put("/:id", upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'image_360', maxCount: 1 }
]), (req, res) => {
    const roomId = req.params.id;
    const { name, price, total_rooms, capacity, description } = req.body;
    
    const newImage = req.files["image"] ? req.files["image"][0].filename : null;
    const newImage360 = req.files["image_360"] ? req.files["image_360"][0].filename : null;

    db.query("SELECT image, image_360 FROM rooms WHERE id = ?", [roomId], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) return res.status(404).json({ message: "Room not found" });

      const oldImage = results[0].image;
      const oldImage360 = results[0].image_360;

      let sql = `
        UPDATE rooms
        SET name = ?, price = ?, total_rooms = ?, capacity = ?, description = ?
        ${newImage ? ", image = ?" : ""}
        ${newImage360 ? ", image_360 = ?" : ""}
        WHERE id = ?
      `;

      const params = [name, price, total_rooms || 1, capacity || 0, description];
      if (newImage) params.push(newImage);
      if (newImage360) params.push(newImage360);
      params.push(roomId);

      db.query(sql, params, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Update failed" });
        }

        // Delete old normal image if replaced
        if (newImage && oldImage) {
          const oldPath = path.join("uploads/rooms", oldImage);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        
        // Delete old 360 image if replaced
        if (newImage360 && oldImage360) {
          const oldPath = path.join("uploads/rooms", oldImage360);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        res.json({
          message: "Room updated successfully",
          image: newImage || oldImage,
          image_360: newImage360 || oldImage360
        });
      });
    });
});


/* ===============================
   DELETE ROOM
================================ */

router.delete("/:id", (req, res) => {

  const roomId = req.params.id;

  const sql = "DELETE FROM rooms WHERE id = ?";

  db.query(sql, [roomId], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({
      message: "Room deleted successfully"
    });

  });

});


/* ===============================
   UPLOAD 360 IMAGE
================================ */

router.put("/:id/image360", upload.single("image"), (req, res) => {
  const roomId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ message: "No 360 image uploaded" });
  }

  const newImage = req.file.filename;

  db.query("SELECT image_360 FROM rooms WHERE id = ?", [roomId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    const oldImage = results[0].image_360;

    db.query("UPDATE rooms SET image_360 = ? WHERE id = ?", [newImage, roomId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Image update failed" });
      }

      /* ===== DELETE OLD IMAGE ===== */
      if (oldImage) {
        const oldPath = path.join("uploads/rooms", oldImage);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      res.json({
        message: "360° Image uploaded successfully",
        image: newImage,
      });
    });
  });
});


module.exports = router;