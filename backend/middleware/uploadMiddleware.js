/**
 * ✅ FIX 10 — Shared Multer Upload Middleware with Validation
 * - File type whitelist (images: jpg/png/webp, docs: pdf)
 * - File size limits (images: 5MB, PDFs: 10MB)
 * - Used across places, rooms, menus, owner, profile routes
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ================= ALLOWED FILE TYPES ================= */
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const PDF_MIME_TYPES = ["application/pdf"];

const IMAGE_FILTER = (req, file, cb) => {
  if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, WEBP images are allowed.`),
      false
    );
  }
};

const PDF_FILTER = (req, file, cb) => {
  if (PDF_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed."), false);
  }
};

/* ================= SIZE LIMITS ================= */
const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;  // 5 MB
const PDF_SIZE_LIMIT   = 10 * 1024 * 1024; // 10 MB

/* ================= STORAGE FACTORY ================= */
const makeStorage = (destFolder, filePrefix) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "..", "uploads", destFolder);
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const prefix = filePrefix || file.fieldname;
      const id = req.params.id || "new";
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${prefix}-${id}-${Date.now()}${ext}`);
    },
  });

/* ================= UPLOAD INSTANCES ================= */

// Places images (5MB, images only)
const uploadPlaceImage = multer({
  storage: makeStorage("places", "place"),
  fileFilter: IMAGE_FILTER,
  limits: { fileSize: IMAGE_SIZE_LIMIT },
});

// Room images + 360° (5MB, images only)
const uploadRoomImage = multer({
  storage: makeStorage("rooms", "room"),
  fileFilter: IMAGE_FILTER,
  limits: { fileSize: IMAGE_SIZE_LIMIT },
});

// Menu images (5MB, images only)
const uploadMenuImage = multer({
  storage: makeStorage("menu", "menu"),
  fileFilter: IMAGE_FILTER,
  limits: { fileSize: IMAGE_SIZE_LIMIT },
});

// Profile avatar (5MB, images only)
const uploadProfileImage = multer({
  storage: makeStorage("profiles", "profile"),
  fileFilter: IMAGE_FILTER,
  limits: { fileSize: IMAGE_SIZE_LIMIT },
});

// PDF menus (10MB, PDF only)
const uploadPdf = multer({
  storage: makeStorage("pdfs", "menu-pdf"),
  fileFilter: PDF_FILTER,
  limits: { fileSize: PDF_SIZE_LIMIT },
});

/* ================= ERROR HANDLER WRAPPER ================= */
// Use this to catch multer errors and return clean JSON responses
const handleMulterError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large. Maximum allowed size exceeded." });
    }
    return res.status(400).json({ message: err.message || "File upload error." });
  });
};

module.exports = {
  uploadPlaceImage,
  uploadRoomImage,
  uploadMenuImage,
  uploadProfileImage,
  uploadPdf,
  handleMulterError,
};
