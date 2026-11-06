require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
  database: process.env.DB_NAME || "findplace",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the pool connection
db.query("SELECT 1", (err) => {
  if (err) {
    console.error("Database connection pool failed:", err);
  } else {
    console.log("MySQL Pool Connected");
  }
});

module.exports = db;
