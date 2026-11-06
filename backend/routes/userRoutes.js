const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");
const path = require("path");

// ✅ FIX 10: Use shared validated upload middleware (images only, 5MB max)
const { uploadProfileImage, handleMulterError } = require("../middleware/uploadMiddleware");
const upload = uploadProfileImage; // alias

router.get("/profile", verifyToken, userController.getProfile);
router.put("/profile", verifyToken, userController.updateProfile);
router.put("/profile/pic", verifyToken, handleMulterError(upload.single("image")), userController.uploadProfilePic);
router.put("/profile/password", verifyToken, userController.changePassword);

module.exports = router;
