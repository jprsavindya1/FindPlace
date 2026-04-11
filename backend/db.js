const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "SavindyaR31@S",
  database: "findplace",
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
