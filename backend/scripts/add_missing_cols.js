const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'SavindyaR31@S',
  database: 'findplace'
});

const sql = `
  ALTER TABLE places
  ADD COLUMN stars INT DEFAULT 0,
  ADD COLUMN wifi TINYINT(1) DEFAULT 0,
  ADD COLUMN ac TINYINT(1) DEFAULT 0,
  ADD COLUMN pool TINYINT(1) DEFAULT 0,
  ADD COLUMN parking TINYINT(1) DEFAULT 0,
  ADD COLUMN breakfast TINYINT(1) DEFAULT 0;
`;

db.query(sql, (err, results) => {
  if (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("Columns already exist.");
    } else {
      console.error("Migration error:", err);
    }
  } else {
    console.log("Migration successful: Added amenities and stars columns.");
  }
  db.end();
});
