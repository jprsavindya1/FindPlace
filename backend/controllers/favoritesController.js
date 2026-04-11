const db = require("../db");

/* ================= ADD FAVORITE ================= */
exports.addFavorite = (req, res) => {
  const userId = req.user.id;
  const { placeId } = req.body;

  if (!placeId) {
    return res.status(400).json({ message: "placeId is required" });
  }

  const query = "INSERT INTO favorites (user_id, place_id) VALUES (?, ?)";
  db.query(query, [userId, placeId], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Already added to favorites" });
      }
      console.error("Error adding favorite:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    
    // Also return the inserted ID just in case
    return res.status(201).json({ message: "Added to favorites", id: result.insertId });
  });
};

/* ================= REMOVE FAVORITE ================= */
exports.removeFavorite = (req, res) => {
  const userId = req.user.id;
  const { placeId } = req.params;

  const query = "DELETE FROM favorites WHERE user_id = ? AND place_id = ?";
  db.query(query, [userId, placeId], (err, result) => {
    if (err) {
      console.error("Error removing favorite:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json({ message: "Removed from favorites" });
  });
};

/* ================= GET USER FAVORITES ================= */
exports.getUserFavorites = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT p.*, f.id AS favorite_id 
    FROM places p 
    INNER JOIN favorites f ON p.id = f.place_id 
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user favorites:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json(results);
  });
};

/* ================= CHECK IF FAVORITE ================= */
exports.checkIsFavorite = (req, res) => {
  const userId = req.user.id;
  const { placeId } = req.params;

  const query = "SELECT id FROM favorites WHERE user_id = ? AND place_id = ?";
  db.query(query, [userId, placeId], (err, results) => {
    if (err) {
      console.error("Error checking favorite status:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    return res.status(200).json({ isFavorite: results.length > 0 });
  });
};
