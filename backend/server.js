require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

/* ================= ROUTES ================= */
const authRoutes = require("./routes/auth");
const placesRoutes = require("./routes/places");
const adminRoutes = require("./routes/adminRoutes"); 
const ownerRoutes = require("./routes/ownerRoutes");
const bookingRoutes = require("./routes/booking");
const reviewRoutes = require("./routes/reviews"); // ⭐ NEW - REVIEWS

/* ================= DB CONNECTION ================= */
const db = require("./db");

const app = express();

/* ================= BASIC MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= TEST DB CONNECTION ================= */
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
    process.exit(1);
  }
  console.log("✅ MySQL Connected");
});

/* ================= STATIC FILES ================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= API ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes); // ⭐ NEW - REVIEWS ROUTE

/* ================= HEALTH CHECK ================= */
app.get("/api/test", (req, res) => {
  res.json({ message: "FindPlace Backend is working 🚀" });
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});