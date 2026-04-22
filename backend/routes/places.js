const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const { verifyToken } = require("../middleware/authMiddleware");

/* ================= DB CONNECTION ================= */
const db = require("../db");

/* ================= MULTER CONFIG (MOVE TO TOP) ================= */
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/places";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      "place-" +
        (req.params.id || "new") +
        "-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });
/* =================================================
   SEARCH PLACES (PUBLIC)
 ================================================= */
router.get("/find-places", (req, res) => {
  console.log("➡️  SEARCH ROUTE HIT: /find-places");
  const { 
    province, district, area, category, keywords, 
    minPrice, maxPrice, stars, wifi, ac, pool, parking, breakfast,
    type, cuisine, ambience,
    sortBy,
    page = 1, limit = 4
  } = req.query;

  // Ensure limit and page are valid numbers
  let pageNum = parseInt(page);
  if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
  
  let limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1) limitNum = 4;

  const offset = (pageNum - 1) * limitNum;

  let whereClause = "WHERE p.status = 'approved'";
  const params = [];

  if (province) {
    whereClause += " AND p.province = ?";
    params.push(province);
  }
  if (district && district.toLowerCase() !== 'sri lanka') {
    whereClause += " AND p.district = ?";
    params.push(district);
  }
  if (area) {
    whereClause += " AND p.area = ?";
    params.push(area);
  }
  if (category) {
    whereClause += " AND p.category = ?";
    params.push(category);
  }
  if (keywords) {
    whereClause += " AND (p.name LIKE ? OR p.keywords LIKE ? OR p.district LIKE ? OR p.province LIKE ?)";
    params.push(`%${keywords}%`, `%${keywords}%`, `%${keywords}%`, `%${keywords}%`);
  }
  if (minPrice) {
    whereClause += " AND (COALESCE((SELECT MIN(price) FROM rooms WHERE place_id = p.id), p.price)) >= ?";
    params.push(minPrice);
  }
  if (maxPrice) {
    whereClause += " AND (COALESCE((SELECT MIN(price) FROM rooms WHERE place_id = p.id), p.price)) <= ?";
    params.push(maxPrice);
  }
  if (stars) {
    const starList = typeof stars === 'string' ? stars.split(',').map(s => parseInt(s)).filter(s => !isNaN(s)) : [parseInt(stars)];
    if (starList.length > 0) {
      const placeholders = starList.map(() => '?').join(',');
      whereClause += ` AND p.stars IN (${placeholders})`;
      params.push(...starList);
    }
  }
  if (wifi === 'true') {
    whereClause += " AND p.id IN (SELECT place_id FROM place_amenities WHERE amenity_id = 1)";
  }
  if (ac === 'true') {
    whereClause += " AND p.id IN (SELECT place_id FROM place_amenities WHERE amenity_id = 4)";
  }
  if (pool === 'true') {
    whereClause += " AND p.id IN (SELECT place_id FROM place_amenities WHERE amenity_id = 3)";
  }
  if (parking === 'true') {
    whereClause += " AND p.id IN (SELECT place_id FROM place_amenities WHERE amenity_id = 2)";
  }
  if (breakfast === 'true') {
    whereClause += " AND p.id IN (SELECT place_id FROM place_amenities WHERE amenity_id = 5)";
  }
  if (type) {
    whereClause += " AND p.type = ?";
    params.push(type);
  }
  if (cuisine) {
    whereClause += " AND p.cuisine_type = ?";
    params.push(cuisine);
  }
  if (ambience) {
    whereClause += " AND p.ambience LIKE ?";
    params.push(`%${ambience}%`);
  }
  let orderBy = "p.id DESC";
  if (sortBy === 'price-low') {
    orderBy = "effective_price ASC";
  } else if (sortBy === 'rating') {
    orderBy = "avg_rating DESC, review_count DESC";
  }

  // Final Queries
  let sql = `
    SELECT p.*, 
           COALESCE((SELECT MIN(price) FROM rooms WHERE place_id = p.id), p.price) as price,
           COALESCE((SELECT MIN(price) FROM rooms WHERE place_id = p.id), p.price) as effective_price,
           COALESCE(rev.avg_rating, 0) as avg_rating,
           COALESCE(rev.review_count, 0) as review_count
    FROM places p
    LEFT JOIN (
      SELECT place_id, 
             AVG(rating) as avg_rating, 
             COUNT(*) as review_count 
      FROM reviews 
      GROUP BY place_id
    ) rev ON p.id = rev.place_id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const countSql = `SELECT COUNT(*) as total FROM places p ${whereClause}`;
  const queryParams = [...params, limitNum, offset];

  db.query(countSql, params, (err, countResult) => {
    if (err) {
      console.error("Count query error:", err);
      return res.status(500).json({ message: "Search failed" });
    }
    
    const totalRecords = countResult[0] ? countResult[0].total : 0;
    
    console.log(`[Search] Found total: ${totalRecords}`);

    db.query(sql, queryParams, (err, results) => {
      if (err) {
        console.error("Search SQL Error:", err);
        return res.status(500).json({ message: "Search failed", error: err.message });
      }
      res.json({
        results,
        totalRecords,
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum)
      });
    });
  });
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
   GET TRENDING LOCATIONS (PUBLIC)
   Groups by district/area and ranks by bookings + ratings
================================================= */
router.get("/trending", (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.name, 
      p.district, 
      p.province, 
      p.area,
      p.category,
      p.image,
      COUNT(DISTINCT b.id) AS booking_count,
      COUNT(DISTINCT r.id) AS review_count,
      ROUND(AVG(r.rating), 1) AS avg_rating,
      (COUNT(DISTINCT b.id) * 10 + COUNT(DISTINCT r.id) * 5) AS popularity_score
    FROM places p
    LEFT JOIN bookings b ON p.id = b.place_id AND b.status = 'CONFIRMED'
    LEFT JOIN reviews r ON p.id = r.place_id
    WHERE p.status = 'approved'
    GROUP BY p.id
    ORDER BY popularity_score DESC, avg_rating DESC
    LIMIT 6
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Trending error:", err);
      return res.status(500).json({ message: "Failed to fetch trending locations" });
    }
    res.json(results);
  });
});

/* =================================================
   GET NEARBY PLACES (PUBLIC)
   Uses Haversine Formula for distance calculation
================================================= */
router.get("/nearby", (req, res) => {
  const { lat, lng } = req.query;
  const radius = req.query.radius || 50;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Latitude and Longitude are required." });
  }

  const sql = `
    SELECT *, 
    ( 6371 * acos( 
        LEAST(1, GREATEST(-1, 
          cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + 
          sin(radians(?)) * sin(radians(latitude))
        ))
      )
    ) AS distance
    FROM places
    WHERE status = 'approved' AND latitude IS NOT NULL AND longitude IS NOT NULL
    HAVING distance < ?
    ORDER BY distance
    LIMIT 8
  `;

  db.query(sql, [lat, lng, lat, radius], (err, results) => {
    if (err) {
      console.error("Fetch nearby places error:", err);
      return res.status(500).json({ message: "Failed to fetch nearby places" });
    }
    res.json(results);
  });
});

/* =================================================
   SAVE SEARCH HISTORY (CUSTOMER ONLY)
================================================= */
router.post("/save-search", verifyToken, (req, res) => {

  const { province, district, category, minPrice, maxPrice, keywords } = req.body;

  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Customers only" });
  }

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
   RECOMMENDATIONS (CUSTOMER ONLY)
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

    const latest = history.find((h) => h.category || h.province) || history[0];

    const category = latest.category || null;
    const province = latest.province || null;

    if (!category && !province) return res.json([]);

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

    recommendSql += " ORDER BY RAND() LIMIT 4";

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
   CREATE OWNER PLACE (NEW)
================================================= */
router.post("/owner/places", verifyToken, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }, { name: 'menu_pdf', maxCount: 1 }]), (req, res) => {
  
  if (req.user.id && req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner only" });
  }

  const {
    name, location, whatsapp, price, province, district, area, category, 
    keywords, description, latitude, longitude, check_in, check_out, 
    pets_allowed, smoking_allowed, extra_rules,
    type, cuisine_type, table_capacity, opening_hours, closing_hours
  } = req.body;

  let amenities = [];
  try {
     amenities = JSON.parse(req.body.amenities || "[]");
  } catch(e) { console.error("Amenity parse error"); }

  const ownerId = req.user.id;
  const image = req.files && req.files.image ? req.files.image[0].filename : null;
  const gallery = req.files && req.files.gallery ? req.files.gallery : [];
  const menuPdf = req.files && req.files.menu_pdf ? req.files.menu_pdf[0].filename : null;

  const sql = `
    INSERT INTO places (
      name, location, whatsapp, price, province, district, area, category, 
      keywords, description, latitude, longitude, owner_id, status,
      check_in, check_out, pets_allowed, smoking_allowed, extra_rules, image,
      type, cuisine_type, table_capacity, opening_hours, closing_hours, menu_pdf
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    name,
    location || null,
    whatsapp || null,
    price || null,
    province || null,
    district || null,
    area || null,
    category || null,
    keywords || null,
    description || null,
    latitude || null,
    longitude || null,
    ownerId,
    check_in || '2:00 PM',
    check_out || '11:00 AM',
    pets_allowed === 'true' || pets_allowed === true ? 1 : 0,
    smoking_allowed === 'true' || smoking_allowed === true ? 1 : 0,
    extra_rules || null,
    image,
    (type && type.toLowerCase() === 'dining' ? 'dine' : (type && type.toLowerCase() === 'accommodation' ? 'stay' : (type ? type.toLowerCase() : 'stay'))),
    cuisine_type || null,
    table_capacity || null,
    opening_hours || null,
    closing_hours || null,
    menuPdf
  ];

  db.query(sql, values, (err, result) => {
    
    if (err) {
      console.error("Create place error:", err);
      return res.status(500).json({ message: "Failed to create place" });
    }

    const placeId = result.insertId;

    // Insert gallery images
    if (gallery.length > 0) {
      const gallerySql = "INSERT INTO place_gallery (place_id, image_path) VALUES ?";
      const galleryValues = gallery.map(file => [placeId, file.filename]);
      db.query(gallerySql, [galleryValues], (err) => {
        if (err) console.error("Gallery insert error:", err);
      });
    }

    // Insert amenities
    if (amenities && amenities.length > 0) {
      const amenitySql = "INSERT INTO place_amenities (place_id, amenity_id) VALUES ?";
      const amenityValues = amenities.map(amenityId => [placeId, amenityId]);
      
      db.query(amenitySql, [amenityValues], (err) => {
        if (err) console.error("Amenities insert error:", err);
      });
    }

    // ⭐ INTEGRATED: Initial Menu Items
    const preOrderItemsRaw = req.body.pre_order_items;
    if (preOrderItemsRaw) {
      try {
        const preOrderItems = JSON.parse(preOrderItemsRaw);
        if (preOrderItems.length > 0) {
          const menuSql = "INSERT INTO menu (place_id, name, price, category) VALUES ?";
          const menuValues = preOrderItems.map(item => [placeId, item.name, item.price, item.category]);
          db.query(menuSql, [menuValues], (err) => {
            if (err) console.error("Initial menu insert error:", err);
          });
        }
      } catch (e) {
        console.error("Failed to parse pre_order_items JSON", e);
      }
    }

    res.json({ message: "Place created successfully (Pending approval)" });

  });
});

/* =================================================
   ADD GALLERY IMAGES TO EXISTING PLACE
   ================================================= */
router.put("/owner/places/:id/gallery", verifyToken, upload.array("gallery", 10), (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner only" });
  }

  const placeId = req.params.id;
  const gallery = req.files || [];

  if (gallery.length === 0) {
    return res.status(400).json({ message: "No images provided" });
  }

  const gallerySql = "INSERT INTO place_gallery (place_id, image_path) VALUES ?";
  const galleryValues = gallery.map(file => [placeId, file.filename]);

  db.query(gallerySql, [galleryValues], (err) => {
    if (err) {
      console.error("Gallery update error:", err);
      return res.status(500).json({ message: "Failed to add gallery images" });
    }
    res.json({ message: "Gallery updated successfully" });
  });
});

/* =================================================
   GET PLACE GALLERY
   ================================================= */
router.get("/:id/gallery", (req, res) => {
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

/* =================================================
   UPDATE COVER IMAGE
   ================================================= */
router.put("/owner/places/:id/image", verifyToken, upload.single("image"), (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner only" });
  }

  const placeId = req.params.id;
  const ownerId = req.user.id;
  const image = req.file ? req.file.filename : null;

  if (!image) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  const sql = "UPDATE places SET image = ? WHERE id = ? AND owner_id = ?";
  db.query(sql, [image, placeId, ownerId], (err, result) => {
    if (err) {
      console.error("Cover image update error:", err);
      return res.status(500).json({ message: "Failed to update cover image" });
    }
    if (result.affectedRows === 0) {
      return res.status(403).json({ message: "Not allowed to update this place" });
    }
    res.json({ message: "Cover image updated successfully" });
  });
});


/* =================================================
   UPDATE FLOOR PLAN IMAGE
   ================================================= */
router.put("/owner/places/:id/floor-plan", verifyToken, upload.single("floor_plan"), (req, res) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner only" });
  }

  const placeId = req.params.id;
  const ownerId = req.user.id;
  const image = req.file ? req.file.filename : null;

  console.log(`[DEBUG] Floor plan upload attempt: Place ID ${placeId}, Owner ID ${ownerId}, File: ${image}`);

  if (!image) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  const sql = "UPDATE places SET floor_plan_image = ? WHERE id = ? AND owner_id = ?";
  db.query(sql, [image, placeId, ownerId], (err, result) => {
    if (err) {
      console.error("Floor plan image update error:", err);
      return res.status(500).json({ message: "Failed to update floor plan image" });
    }
    if (result.affectedRows === 0) {
      return res.status(403).json({ message: "Not allowed to update this place" });
    }
    res.json({ message: "Floor plan image updated successfully", filename: image });
  });
});

/* =================================================
   UPDATE OWNER PLACE (UPDATED WITH HOUSE RULES)
================================================= */
router.put("/owner/places/:id", verifyToken, (req, res) => {

  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner only" });
  }

  const placeId = req.params.id;
  const ownerId = req.user.id;

  const {
    name,
    location,
    whatsapp,
    price,
    province,
    district,
    area,
    category,
    keywords,
    description,
    latitude,
    longitude,
    amenities,
    check_in,
    check_out,
    pets_allowed,
    smoking_allowed,
    extra_rules,
    type,
    cuisine_type,
    table_capacity,
    opening_hours,
    closing_hours
  } = req.body;

  const sql = `
    UPDATE places 
    SET name = ?, location = ?, whatsapp = ?, price = ?, province = ?, district = ?, area = ?, 
        category = ?, keywords = ?, description = ?, latitude = ?, longitude = ?,
        check_in = ?, check_out = ?, pets_allowed = ?, smoking_allowed = ?, extra_rules = ?,
        type = ?, cuisine_type = ?, table_capacity = ?, opening_hours = ?, closing_hours = ?
    WHERE id = ? AND owner_id = ?
  `;

  const values = [
    name,
    location || null,
    whatsapp || null,
    price || null,
    province || null,
    district || null,
    area || null,
    category || null,
    keywords || null,
    description || null,
    latitude || null,
    longitude || null,
    check_in || '2:00 PM',
    check_out || '11:00 AM',
    pets_allowed ? 1 : 0,
    smoking_allowed ? 1 : 0,
    extra_rules || null,
    (type && type.toLowerCase() === 'dining' ? 'dine' : (type && type.toLowerCase() === 'accommodation' ? 'stay' : (type ? type.toLowerCase() : 'stay'))),
    cuisine_type || null,
    table_capacity || null,
    opening_hours || null,
    closing_hours || null,
    placeId,
    ownerId
  ];

  db.query(sql, values, (err, result) => {

    if (err) {
      console.error("Update owner place error:", err);
      return res.status(500).json({ message: "Update failed", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: "Not allowed to update this place" });
    }

    // ⭐ INTEGRATED: Initial Menu Items (Update Mode)
    const preOrderItemsRaw = req.body.pre_order_items;
    if (preOrderItemsRaw) {
      try {
        const preOrderItems = JSON.parse(preOrderItemsRaw);
        if (preOrderItems.length > 0) {
          const menuSql = "INSERT INTO menu (place_id, name, price, category) VALUES ?";
          const menuValues = preOrderItems.map(item => [placeId, item.name, item.price, item.category]);
          db.query(menuSql, [menuValues], (err) => {
            if (err) console.error("Initial menu insert (update mode) error:", err);
          });
        }
      } catch (e) {
        console.error("Failed to parse pre_order_items JSON in update mode", e);
      }
    }

    // Update amenities
    db.query("DELETE FROM place_amenities WHERE place_id = ?", [placeId], (err) => {
      if (err) console.error("Delete amenities error:", err);
      
      if (amenities && amenities.length > 0) {
        const amenitySql = "INSERT INTO place_amenities (place_id, amenity_id) VALUES ?";
        const amenityValues = amenities.map(amenityId => [placeId, amenityId]);
        
        db.query(amenitySql, [amenityValues], (err) => {
          if (err) console.error("Amenities insert error:", err);
        });
      }
    });

    res.json({ message: "Place updated successfully" });

  });
});

/* =================================================
   GET OWNER PLACES
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
   GET PLACE AMENITIES
================================================= */
router.get("/:id/amenities", (req, res) => {

  const placeId = req.params.id;

  const sql = `
    SELECT a.id, a.name
    FROM place_amenities pa
    JOIN amenities a ON pa.amenity_id = a.id
    WHERE pa.place_id = ?
  `;

  db.query(sql, [placeId], (err, results) => {

    if (err) {
      console.error("Amenities fetch error:", err);
      return res.status(500).json({ message: "Failed to fetch amenities" });
    }

    res.json(results);

  });

});

/* ======================================================
   GET PLACES BY IDS (PUBLIC)
====================================================== */
router.get("/ids", (req, res) => {
  const idsParam = req.query.ids;
  console.log("[Backend] Fetching places for IDs:", idsParam);

  if (!idsParam) {
    return res.json([]);
  }

  const ids = idsParam.split(",").map(id => id.trim()).filter(id => id !== "");

  if (ids.length === 0) {
    return res.json([]);
  }

  // Create placeholders for the query
  const placeholders = ids.map(() => "?").join(",");
  const sql = `
    SELECT *
    FROM places
    WHERE id IN (${placeholders})
    AND status = 'approved'
  `;

  db.query(sql, ids, (err, results) => {
    if (err) {
      console.error("Fetch places by IDs error:", err);
      return res.status(500).json({ message: "Failed to fetch places" });
    }

    // Sort results to match the order of IDs passed
    const resultsMap = new Map(results.map(place => [place.id.toString(), place]));
    const sortedResults = ids
      .map(id => resultsMap.get(id.toString()))
      .filter(place => !!place);

    res.json(sortedResults);
  });
});

/* =================================================
   GET SINGLE PLACE
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


/* =================================================
   DELETE PLACE
================================================= */
router.delete("/:id", verifyToken, (req, res) => {

  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner only" });
  }

  const placeId = req.params.id;
  const ownerId = req.user.id;

  // 1. Check if the place belongs to the owner before doing anything
  db.query("SELECT id FROM places WHERE id = ? AND owner_id = ?", [placeId, ownerId], (err, results) => {
    if (results.length === 0) return res.status(403).json({ message: "Not allowed" });

    // 2. Start sequential deletion of dependent records
    db.query("DELETE FROM place_amenities WHERE place_id = ?", [placeId], (err) => {
      if (err) console.error("Del amenities err:", err);
      
      db.query("DELETE FROM rooms WHERE place_id = ?", [placeId], (err) => {
        if (err) console.error("Del rooms err:", err);
        
        db.query("DELETE FROM menu WHERE place_id = ?", [placeId], (err) => {
          if (err) console.error("Del menu err:", err);
          
          // 3. Finally delete the place itself
          const sql = "DELETE FROM places WHERE id = ? AND owner_id = ?";
          db.query(sql, [placeId, ownerId], (err, result) => {
            if (err) {
              console.error("Delete place error:", err);
              return res.status(500).json({ message: "Delete failed" });
            }
            res.json({ message: "Place and related data deleted successfully" });
          });
        });
      });
    });
  });

});



/* ======================================================
   OWNER – UPLOAD / UPDATE OWN PLACE IMAGE
====================================================== */
router.put(
  "/owner/places/:id/image",
  verifyToken,
  upload.single("image"),
  (req, res) => {

    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Owner only" });
    }

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
              const oldPath = path.join("uploads/places", oldImage);

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

/* ================= UPDATE TABLE BOOKING MODE ================= */
router.put('/owner/places/:id/booking-mode', verifyToken, (req, res) => {
  const placeId = req.params.id;
  const { table_booking_mode } = req.body;

  if (!['list', 'map'].includes(table_booking_mode)) {
    return res.status(400).json({ message: "Invalid booking mode" });
  }

  const sql = "UPDATE places SET table_booking_mode = ? WHERE id = ? AND owner_id = ?";
  db.query(sql, [table_booking_mode, placeId, req.user.id], (err, result) => {
    if (err) {
      console.error("Error updating booking mode:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Place not found or unauthorized" });
    }
    res.json({ message: "Booking mode updated successfully", table_booking_mode });
  });
});

module.exports = router;
