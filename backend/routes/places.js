const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const { verifyToken } = require("../middleware/authMiddleware");

/* ================= DB CONNECTION ================= */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* =================================================
   GET ALL PLACES (PUBLIC)
   ================================================= */
router.get("/", (req, res) => {
  const sql = `
    SELECT *
    FROM places
    WHERE status = 'approved'
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Fetch places error:", err);
      return res.status(500).json({ message: "Failed to fetch places" });
    }
    res.json(results);
  });
});

/* =================================================
   SEARCH PLACES (PUBLIC)
   ================================================= */
router.get("/search", (req, res) => {
  const { province, district, area, category, keywords, minPrice, maxPrice } =
    req.query;

  let sql = `
    SELECT *
    FROM places
    WHERE status = 'approved'
  `;
  const params = [];

  if (province) {
    sql += " AND province = ?";
    params.push(province);
  }
  if (district) {
    sql += " AND district = ?";
    params.push(district);
  }
  if (area) {
    sql += " AND area = ?";
    params.push(area);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (keywords) {
    sql += " AND keywords LIKE ?";
    params.push(`%${keywords}%`);
  }
  if (minPrice) {
    sql += " AND CAST(price AS DECIMAL(10,2)) >= ?";
    params.push(minPrice);
  }
  if (maxPrice) {
    sql += " AND CAST(price AS DECIMAL(10,2)) <= ?";
    params.push(maxPrice);
  }

  sql += " ORDER BY id DESC";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Search error:", err);
      return res.status(500).json({ message: "Search failed" });
    }
    res.json(results);
  });
});

/* =================================================
   ✅ SAVE SEARCH HISTORY (CUSTOMER ONLY)
   POST /api/places/save-search
   ================================================= */
router.post("/save-search", verifyToken, (req, res) => {
  const { province, district, category, minPrice, maxPrice, keywords } = req.body;

  // customer only
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Customers only" });
  }

  // (Optional) prevent saving completely empty search
  const hasAny =
    province || district || category || minPrice || maxPrice || keywords;
  if (!hasAny) {
    return res.json({ message: "No filters to save" });
  }

  const sql = `
    INSERT INTO search_history
      (user_id, province, district, category, min_price, max_price, keywords)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      req.user.id,
      province || null,
      district || null,
      category || null,
      minPrice || null,
      maxPrice || null,
      keywords || null,
    ],
    (err) => {
      if (err) {
        console.error("Save search error:", err);
        return res.status(500).json({ message: "Failed to save search" });
      }
      res.json({ message: "Search saved" });
    }
  );
});

/* =================================================
   ✅ RECOMMENDATIONS (CUSTOMER ONLY)
   GET /api/places/recommendations
   ================================================= */
router.get("/recommendations", verifyToken, (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Customers only" });
  }

  const historySql = `
    SELECT category, province
    FROM search_history
    WHERE user_id = ?
    ORDER BY searched_at DESC
    LIMIT 5
  `;

  db.query(historySql, [req.user.id], (err, history) => {
    if (err) {
      console.error("History fetch error:", err);
      return res.status(500).json({ message: "Error fetching history" });
    }

    if (!history || history.length === 0) {
      return res.json([]);
    }

    // pick latest non-null values
    const latest = history.find((h) => h.category || h.province) || history[0];
    const category = latest.category || null;
    const province = latest.province || null;

    // If both null, return empty
    if (!category && !province) return res.json([]);

    // Build dynamic recommend query
    let recommendSql = `
      SELECT *
      FROM places
      WHERE status = 'approved'
    `;
    const params = [];

    if (category) {
      recommendSql += " AND category = ?";
      params.push(category);
    }
    if (province) {
      recommendSql += " AND province = ?";
      params.push(province);
    }

    recommendSql += `
      ORDER BY RAND()
      LIMIT 4
    `;

    db.query(recommendSql, params, (err, results) => {
      if (err) {
        console.error("Recommend error:", err);
        return res.status(500).json({ message: "Error fetching recommendations" });
      }
      res.json(results);
    });
  });
});

/* =================================================
   GET OWNER PLACES (OWNER DASHBOARD)
   ================================================= */
router.get("/my", verifyToken, (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner only" });
  }

  const sql = `
    SELECT *
    FROM places
    WHERE owner_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Fetch owner places error:", err);
      return res.status(500).json({ message: "Failed to fetch places" });
    }
    res.json(results);
  });
});

/* =================================================
   UPDATE PLACE (OWNER ONLY + OWNERSHIP CHECK) 🔒
   ================================================= */
router.put("/:id", verifyToken, (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner only" });
  }

  const placeId = req.params.id;
  const ownerId = req.user.id;

  const { name, location, price, province, district, area, category, keywords } =
    req.body;

  const sql = `
    UPDATE places
    SET 
      name = ?,
      location = ?,
      price = ?,
      province = ?,
      district = ?,
      area = ?,
      category = ?,
      keywords = ?,
      status = 'approved'
    WHERE id = ? AND owner_id = ?
  `;

  db.query(
    sql,
    [
      name,
      location,
      price,
      province,
      district,
      area,
      category,
      keywords,
      placeId,
      ownerId,
    ],
    (err, result) => {
      if (err) {
        console.error("Update place error:", err);
        return res.status(500).json({ message: "Update failed" });
      }

      if (result.affectedRows === 0) {
        return res.status(403).json({
          message: "Not allowed to update this place",
        });
      }

      res.json({ message: "Place updated successfully" });
    }
  );
});

/* =================================================
   DELETE PLACE (OWNER ONLY + OWNERSHIP CHECK) 🔥
   ================================================= */
router.delete("/:id", verifyToken, (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner only" });
  }

  const placeId = req.params.id;
  const ownerId = req.user.id;

  const sql = `
    DELETE FROM places
    WHERE id = ? AND owner_id = ?
  `;

  db.query(sql, [placeId, ownerId], (err, result) => {
    if (err) {
      console.error("Delete place error:", err);
      return res.status(500).json({ message: "Delete failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(403).json({
        message: "Not allowed to delete this place",
      });
    }

    res.json({ message: "Place deleted successfully" });
  });
});

/* =================================================
   GET SINGLE PLACE (PUBLIC)
   MUST BE LAST ✅
   ================================================= */
router.get("/:id", (req, res) => {
  const placeId = req.params.id;

  const sql = `
    SELECT *
    FROM places
    WHERE id = ?
      AND status = 'approved'
    LIMIT 1
  `;

  db.query(sql, [placeId], (err, results) => {
    if (err) {
      console.error("Get place error:", err);
      return res.status(500).json({ message: "Failed to fetch place" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Place not found" });
    }

    res.json(results[0]);
  });
});

module.exports = router;