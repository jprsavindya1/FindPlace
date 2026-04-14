require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// 🔥 DEBUG LOGGING TO FILE
const logFile = path.join(__dirname, "debug.log");
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
console.log = function(...args) {
  const msg = require('util').format(...args);
  logStream.write(`[LOG] ${new Date().toISOString()}: ${msg}\n`);
  process.stdout.write(msg + '\n');
};
console.error = function(...args) {
  const msg = require('util').format(...args);
  logStream.write(`[ERR] ${new Date().toISOString()}: ${msg}\n`);
  process.stderr.write(msg + '\n');
};

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

/* ================= DB CONNECTION ================= */
const db = require("./db");

const app = express();

/* ================= BASIC MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= TEST DB CONNECTION ================= */
// The pool maintains connections automatically.
// We can do a quick query ping to ensure connectivity.
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
const PORT = 5007;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});