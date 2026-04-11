const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favoritesController");
const { verifyToken } = require("../middleware/authMiddleware");

// All favorites routes require authentication
router.post("/", verifyToken, favoritesController.addFavorite);
router.delete("/:placeId", verifyToken, favoritesController.removeFavorite);
router.get("/", verifyToken, favoritesController.getUserFavorites);
router.get("/check/:placeId", verifyToken, favoritesController.checkIsFavorite);

module.exports = router;
