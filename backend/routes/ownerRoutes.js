const express = require("express");
const router = express.Router();
const db = require("../db");
const {
  verifyToken,
  verifyOwnerOrAdmin,
} = require("../middleware/authMiddleware");

/* ================= MULTER IMPORTS ================= */
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ================= MULTER STORAGE CONFIG ================= */
const placeImgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/places");
  },
  filename: (req, file, cb) => {
    cb(null, "place-" + req.params.id + "-" + Date.now() + path.extname(file.originalname));
  },
});

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/pdfs");
  },
  filename: (req, file, cb) => {
    cb(null, "menu-pdf-" + req.params.id + "-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: placeImgStorage });
const uploadPdf = multer({ 
  storage: pdfStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  }
});

// OWNER – ADD NEW PLACE logic handled in places.js

// OWNER – EDIT OWN PLACE logic handled in places.js

/* ======================================================
   OWNER – GET OWN PLACES
====================================================== */
router.get("/places", verifyToken, verifyOwnerOrAdmin, (req, res) => {

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
router.delete("/places/:id", verifyToken, verifyOwnerOrAdmin, (req, res) => {

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
  verifyOwnerOrAdmin,
  upload.single("image"),
  (req, res) => {

    const placeId = req.params.id;
    const ownerId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const newImage = req.file.filename;

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

        db.query(
          "UPDATE places SET image = ? WHERE id = ?",
          [newImage, placeId],
          (err) => {

            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Image update failed" });
            }

            /* ===== DELETE OLD IMAGE ===== */

            if (oldImage) {
              const oldPath = path.join("uploads/places", oldImage); // ⭐ UPDATED

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

/* ======================================================
   OWNER – UPLOAD / UPDATE GALLERY IMAGES (REPLACE MODE)
====================================================== */
router.put(
  "/places/:id/gallery",
  verifyToken,
  verifyOwnerOrAdmin,
  upload.array("gallery", 10),
  (req, res) => {
    const placeId = req.params.id;
    const ownerId = req.user.id;
    const newFiles = req.files || [];

    if (newFiles.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // 1. Verify ownership first
    db.query("SELECT id FROM places WHERE id = ? AND owner_id = ?", [placeId, ownerId], (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(403).json({ message: "Not your place" });

      // 2. Get old gallery images to delete from disk
      db.query("SELECT image_path FROM place_gallery WHERE place_id = ?", [placeId], (err, oldImages) => {
        if (err) console.error("Fetch old gallery error:", err);

        // 3. Delete old entries from DB
        db.query("DELETE FROM place_gallery WHERE place_id = ?", [placeId], (err) => {
          if (err) {
            console.error("Gallery clear error:", err);
            return res.status(500).json({ message: "Failed to clear old gallery" });
          }

          // 4. Insert new entries
          const gallerySql = "INSERT INTO place_gallery (place_id, image_path) VALUES ?";
          const galleryValues = newFiles.map(file => [placeId, file.filename]);

          db.query(gallerySql, [galleryValues], (err) => {
            if (err) {
              console.error("Gallery insert error:", err);
              return res.status(500).json({ message: "Failed to add new gallery images" });
            }

            // 5. Cleanup old files from disk
            if (oldImages && oldImages.length > 0) {
              oldImages.forEach(img => {
                if (img.image_path) {
                  const oldPath = path.join("uploads/places", img.image_path);
                  if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                  }
                }
              });
            }

            res.json({ message: "Gallery updated successfully (Replaced old photos)" });
          });
        });
      });
    });
  }
);

/* ======================================================
   OWNER – UPLOAD / UPDATE MENU PDF
====================================================== */
router.put(
  "/places/:id/menu-pdf",
  verifyToken,
  verifyOwnerOrAdmin,
  uploadPdf.single("menu_pdf"),
  (req, res) => {
    const placeId = req.params.id;
    const ownerId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    const pdfPath = req.file.filename;

    // 1. Get old PDF to delete if exists
    db.query("SELECT menu_pdf FROM places WHERE id = ? AND owner_id = ?", [placeId, ownerId], (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0) return res.status(404).json({ message: "Place not found" });

      const oldPdf = results[0].menu_pdf;

      // 2. Update DB
      const sql = "UPDATE places SET menu_pdf = ? WHERE id = ? AND owner_id = ?";
      db.query(sql, [pdfPath, placeId, ownerId], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Update failed" });
        }

        // 3. Delete old file
        if (oldPdf) {
          const oldPath = path.join("uploads/pdfs", oldPdf);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        res.json({ message: "Menu PDF updated successfully", filename: pdfPath });
      });
    });
  }
);

/* ======================================================
   OWNER – DELETE GALLERY IMAGE
====================================================== */
router.delete("/gallery/:imageId", verifyToken, verifyOwnerOrAdmin, (req, res) => {
  const imageId = req.params.imageId;
  const ownerId = req.user.id;

  // 1. Check if image exists and owner has permission
  const checkSql = `
    SELECT pg.image_path, p.owner_id 
    FROM place_gallery pg
    JOIN places p ON pg.place_id = p.id
    WHERE pg.id = ?
  `;

  db.query(checkSql, [imageId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (results[0].owner_id !== ownerId) {
      return res.status(403).json({ message: "Unauthorized deletion" });
    }

    const imagePath = results[0].image_path;

    // 2. Delete from database
    db.query("DELETE FROM place_gallery WHERE id = ?", [imageId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Deletion failed" });
      }

      // 3. Delete physical file
      if (imagePath) {
        const fullPath = path.join("uploads/places", imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      res.json({ message: "Gallery image deleted successfully" });
    });
  });
});

/* ======================================================
   OWNER – DELETE COVER IMAGE
====================================================== */
router.delete("/places/:id/image", verifyToken, verifyOwnerOrAdmin, (req, res) => {
  const placeId = req.params.id;
  const ownerId = req.user.id;

  db.query(
    "SELECT image FROM places WHERE id = ? AND owner_id = ?",
    [placeId, ownerId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Place not found or unauthorized" });
      }

      const oldImage = results[0].image;

      db.query(
        "UPDATE places SET image = NULL WHERE id = ?",
        [placeId],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to clear cover image" });
          }

          if (oldImage) {
            const oldPath = path.join("uploads/places", oldImage);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }

          res.json({ message: "Cover image removed successfully" });
        }
      );
    }
  );
});

/* ======================================================
   GET PLACE GALLERY
====================================================== */
router.get("/places/:id/gallery", (req, res) => {
  const placeId = req.params.id;
  const sql = "SELECT * FROM place_gallery WHERE place_id = ? ORDER BY id ASC";

  db.query(sql, [placeId], (err, results) => {
    if (err) {
      console.error("Fetch gallery error:", err);
      return res.status(500).json({ message: "Failed to fetch gallery" });
    }
    res.json(results);
  });
});

/* ======================================================
   OWNER – DINING ANALYTICS (PEAK HOURS)
====================================================== */
router.get("/dining/analytics/peak-hours", verifyToken, verifyOwnerOrAdmin, (req, res) => {
  const { placeId } = req.query;
  const ownerId = req.user.id;

  let sql = `
    SELECT HOUR(res_time) as hour, COUNT(*) as count
    FROM reservations r
    JOIN places p ON r.place_id = p.id
    WHERE p.owner_id = ?
  `;
  const params = [ownerId];

  if (placeId && placeId !== "ALL") {
    sql += " AND r.place_id = ?";
    params.push(placeId);
  }

  sql += " GROUP BY hour ORDER BY count DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch peak hours" });
    }
    res.json(results);
  });
});

/* ======================================================
   OWNER – DINING ANALYTICS (TOP DISHES)
   Note: This assumes we eventually track which dishes are ordered in reservations 
   or just shows distribution of 'is_special' items for now as a proxy.
   For now, we'll return a mock distribution or most viewed if we had tracking.
   User asked for 'Top Selling Dish' - I'll implement a query on menu items
   grouped by a hypothetical orders table, or just return special items for now.
====================================================== */
router.get("/dining/analytics/top-dishes", verifyToken, verifyOwnerOrAdmin, (req, res) => {
  const { placeId } = req.query;
  const ownerId = req.user.id;

  // Since we don't have an 'orders' table yet, we'll return the 'is_special' items
  // as the 'featured' dishes which are the owner's best sellers.
  let sql = `
    SELECT m.name, m.price, m.category
    FROM menu m
    JOIN places p ON m.place_id = p.id
    WHERE p.owner_id = ? AND m.is_special = 1
  `;
  const params = [ownerId];

  if (placeId && placeId !== "ALL") {
    sql += " AND m.place_id = ?";
    params.push(placeId);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch top dishes" });
    }
    res.json(results);
  });
});

/* ======================================================
   OWNER – STAY ANALYTICS (REVENUE)
====================================================== */
router.get("/stay/analytics/revenue", verifyToken, verifyOwnerOrAdmin, (req, res) => {
  const { placeId } = req.query;
  const ownerId = req.user.id;

  let sql = `
    SELECT 
      MONTH(check_in) as month,
      SUM(total_price) as revenue,
      COUNT(*) as booking_count
    FROM bookings
    WHERE owner_id = ? AND status = 'CONFIRMED' AND YEAR(check_in) = YEAR(CURDATE())
  `;
  const params = [ownerId];

  if (placeId && placeId !== "ALL") {
    sql += " AND place_id = ?";
    params.push(placeId);
  }

  sql += " GROUP BY month ORDER BY month ASC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Revenue Analytics Error:", err);
      return res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
    res.json(results);
  });
});

/* ======================================================
   OWNER – UNIFIED DASHBOARD STATS
====================================================== */
router.get("/dashboard-stats", verifyToken, verifyOwnerOrAdmin, (req, res) => {
  const ownerId = req.user.id;

  const statsSql = `
    SELECT 
      (SELECT COUNT(*) FROM bookings WHERE owner_id = ? AND status = 'PENDING') as pending_stay_bookings,
      (SELECT COUNT(*) FROM reservations r JOIN places p ON r.place_id = p.id WHERE p.owner_id = ? AND r.status = 'confirmed' AND r.res_date = CURDATE()) as today_dining_reservations,
      (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE owner_id = ? AND status = 'CONFIRMED' AND MONTH(created_at) = MONTH(CURDATE())) as monthly_stay_revenue,
      (SELECT COALESCE(SUM(total_price), 0) FROM reservations r JOIN places p ON r.place_id = p.id WHERE p.owner_id = ? AND r.status = 'confirmed' AND MONTH(r.res_date) = MONTH(CURDATE())) as monthly_dining_revenue
  `;

  db.query(statsSql, [ownerId, ownerId, ownerId, ownerId], (err, results) => {
    if (err) {
      console.error("Dashboard Stats Error:", err);
      return res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
    res.json(results[0]);
  });
});


module.exports = router;