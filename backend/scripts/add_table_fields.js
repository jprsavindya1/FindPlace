const db = require("./db");

const queries = [
  "ALTER TABLE restaurant_tables ADD COLUMN location_area VARCHAR(50) DEFAULT 'Indoor'",
  "ALTER TABLE restaurant_tables ADD COLUMN table_type VARCHAR(50) DEFAULT 'Standard'",
  "ALTER TABLE restaurant_tables ADD COLUMN min_capacity INT DEFAULT 1",
  "ALTER TABLE restaurant_tables ADD COLUMN is_smoking BOOLEAN DEFAULT FALSE",
  "ALTER TABLE restaurant_tables ADD COLUMN is_combineable BOOLEAN DEFAULT FALSE"
];

let completed = 0;

queries.forEach((q) => {
  db.query(q, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
          console.log(`Column already exists: ${q}`);
      } else {
          console.error(`Error executing ${q}:`, err);
      }
    } else {
      console.log(`Successfully executed: ${q}`);
    }
    
    completed++;
    if (completed === queries.length) {
      console.log("Migration finished.");
      process.exit(0);
    }
  });
});
