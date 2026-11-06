require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const winston = require("winston");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

/* ================= LOGGER (FIX 7 — Replace raw file override) ================= */
// ✅ Production-grade logger: info/error to console + rotating file (max 5MB, no bloat)
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDir, "app.log"),
      maxsize: 5 * 1024 * 1024, // 5MB max
      maxFiles: 3,              // Keep last 3 log files
      tailable: true,
    }),
  ],
});

// ✅ Replace console.log / console.error with Winston
console.log = (...args) => logger.info(args.map(String).join(" "));
console.error = (...args) => logger.error(args.map(String).join(" "));
console.warn = (...args) => logger.warn(args.map(String).join(" "));

/* ================= ROUTES ================= */
const authRoutes = require("./routes/auth");
const placesRoutes = require("./routes/places");
const adminRoutes = require("./routes/adminRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const bookingRoutes = require("./routes/booking");
const reviewRoutes = require("./routes/reviews");
const amenitiesRoutes = require("./routes/amenities");
const menuRoutes = require("./routes/menuRoutes"); // ⭐ FOOD MENU
const roomsRoutes = require("./routes/roomsRoutes"); // ⭐ NEW - ROOM MANAGEMENT
const favoritesRoutes = require("./routes/favoritesRoutes"); // ⭐ FAVORITES
const userRoutes = require("./routes/userRoutes"); // ⭐ PROFILE SYSTEM
const personalizedRoutes = require("./routes/personalized"); // ⭐ PERSONALIZED DASHBOARD
const tableRoutes = require("./routes/tableRoutes"); // ⭐ RESTAURANT TABLES
const reservationRoutes = require("./routes/reservationRoutes"); // ⭐ RESTAURANT RESERVATIONS
const itineraryRoutes = require("./routes/itineraryRoutes"); // ⭐ SMART ITINERARY
const tableLayoutRoutes = require("./routes/tableLayout"); // ⭐ INTERACTIVE FLOOR PLAN

/* ================= DB CONNECTION ================= */
const db = require("./db");

const app = express();

/* ================= BASIC MIDDLEWARE ================= */
// ✅ HTTP request logging via Morgan (dev-friendly, production-safe)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ✅ Whitelist-based CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin} not allowed`), false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ FIX 9: Read httpOnly cookies for refresh token


/* ================= TEST DB CONNECTION ================= */
db.query("SELECT 1", (err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
    process.exit(1);
  }
  console.log("✅ MySQL Pool Connected");
});

/* ================= STATIC FILES ================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads/pdfs", express.static(path.join(__dirname, "uploads/pdfs")));

/* ================= API ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/menu", menuRoutes); // ⭐ FOOD MENU ROUTE
app.use("/api/rooms", roomsRoutes); // ⭐ ROOM MANAGEMENT ROUTE
app.use("/api/favorites", favoritesRoutes); // ⭐ FAVORITES ROUTE
app.use("/api/users", userRoutes); // ⭐ PROFILE SYSTEM ROUTE
app.use("/api/personalized", personalizedRoutes); // ⭐ PERSONALIZED DASHBOARD ROUTE
app.use("/api/tables", tableRoutes); // ⭐ RESTAURANT TABLES ROUTE
app.use("/api/reservations", reservationRoutes); // ⭐ RESTAURANT RESERVATIONS ROUTE
app.use("/api/itinerary", itineraryRoutes); // ⭐ SMART ITINERARY ROUTE
app.use("/api/table-layout", tableLayoutRoutes); // ⭐ INTERACTIVE FLOOR PLAN ROUTE

/* ================= HEALTH CHECK ================= */
app.get("/api/test", (req, res) => {
  res.json({ message: "FindPlace Backend is working 🚀" });
});

app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5007;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});