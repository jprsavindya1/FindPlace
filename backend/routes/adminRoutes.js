const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // ✅ ADDED
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

/* ========================================================
   =================== ADMIN LOGIN ========================
   ======================================================== */

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND role = 'admin'";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const admin = results[0];

    // ✅ bcrypt password compare (DB hash vs entered password)
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // ✅ IMPORTANT: use same secret as authMiddleware (process.env.JWT_SECRET)
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || "findplace_secret",
      { expiresIn: "1d" }
    );

    res.json({ token });
  });
});

/* ========================================================
   =============== IMAGE STORAGE CONFIG ===================
   ======================================================== */

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

/* ========================================================
   ======================= USERS ==========================
   ======================================================== */

/* ================= GET ALL USERS ================= */
router.get("/users", verifyToken, verifyAdmin, (req, res) => {
  const sql = "SELECT id, name, email, role FROM users";

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(result);
  });
});

/* ================= CHANGE USER ROLE ================= */
router.put("/users/:id/role", verifyToken, verifyAdmin, (req, res) => {
  const { role } = req.body;
  const userId = req.params.id;

  if (!role) {
    return res.status(400).json({ message: "Role is required" });
  }

  const sql = "UPDATE users SET role = ? WHERE id = ?";

  db.query(sql, [role, userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Role update failed" });
    }
    res.json({ message: "Role updated successfully" });
  });
});

/* ================= DELETE USER ================= */
router.delete("/users/:id", verifyToken, verifyAdmin, (req, res) => {
  const userId = req.params.id;

  db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Delete failed" });
    }
    res.json({ message: "User deleted successfully" });
  });
});

/* ========================================================
   ======================= PLACES =========================
   ======================================================== */

/* ================= GET ALL PLACES ================= */
router.get("/places", verifyToken, verifyAdmin, (req, res) => {
  const sql = `
    SELECT places.*, users.name AS owner_name, users.email AS owner_email
    FROM places
    JOIN users ON places.owner_id = users.id
    ORDER BY places.status ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

/* ================= APPROVE PLACE ================= */
router.put("/places/:id/approve", verifyToken, verifyAdmin, (req, res) => {
  db.query(
    "UPDATE places SET status = 'approved' WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Approval failed" });
      }
      res.json({ message: "Place approved" });
    }
  );
});

/* ================= REJECT PLACE ================= */
router.put("/places/:id/reject", verifyToken, verifyAdmin, (req, res) => {
  db.query(
    "UPDATE places SET status = 'rejected' WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Rejection failed" });
      }
      res.json({ message: "Place rejected" });
    }
  );
});

/* ================= DELETE PLACE ================= */
router.delete("/places/:id", verifyToken, verifyAdmin, (req, res) => {
  db.query(
    "DELETE FROM places WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Delete failed" });
      }
      res.json({ message: "Place deleted by admin" });
    }
  );
});

/* ================= UPDATE PLACE IMAGE ================= */
router.put(
  "/places/:id/image",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  (req, res) => {
    const placeId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const newImage = req.file.filename;

    db.query(
      "SELECT image FROM places WHERE id = ?",
      [placeId],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: "Place not found" });
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

            if (oldImage) {
              const oldPath = path.join("uploads", oldImage);
              if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            res.json({
              message: "Place image updated successfully",
              image: newImage,
            });
          }
        );
      }
    );
  }
);

module.exports = router;