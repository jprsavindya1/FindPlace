const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'SavindyaR31@S',
  database: 'findplace'
});

const sql = `
  ALTER TABLE places
  ADD COLUMN check_in VARCHAR(100) DEFAULT '2:00 PM',
  ADD COLUMN check_out VARCHAR(100) DEFAULT '11:00 AM',
  ADD COLUMN pets_allowed TINYINT(1) DEFAULT 0,
  ADD COLUMN smoking_allowed TINYINT(1) DEFAULT 0,
  ADD COLUMN extra_rules TEXT;
`;

db.query(sql, (err, results) => {
  if (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("House rules columns already exist.");
    } else {
      console.error("Migration error:", err);
    }
  } else {
    console.log("Migration successful: Added house rules columns.");
  }
  db.end();
});
