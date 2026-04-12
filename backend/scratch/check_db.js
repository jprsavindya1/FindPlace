const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "SavindyaR31@S",
  database: "findplace",
});

db.query("DESCRIBE reservations", (err, results) => {
  if (err) {
    console.error("Error describing reservations:", err);
  } else {
    console.log("RESERVATIONS TABLE:");
    console.table(results);
  }
  
  db.query("DESCRIBE bookings", (err, results) => {
    if (err) {
      console.error("Error describing bookings:", err);
    } else {
      console.log("BOOKINGS TABLE:");
      console.table(results);
    }
    process.exit();
  });
});
