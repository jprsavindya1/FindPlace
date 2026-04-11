const db = require("./db");

const queries = [
  "ALTER TABLE menu ADD COLUMN spicy_level VARCHAR(50) DEFAULT 'None'",
  "ALTER TABLE menu ADD COLUMN contains_alcohol BOOLEAN DEFAULT FALSE",
  "ALTER TABLE menu ADD COLUMN chefs_recommendation BOOLEAN DEFAULT FALSE",
  "ALTER TABLE menu ADD COLUMN prep_time VARCHAR(50) DEFAULT ''",
  "ALTER TABLE menu ADD COLUMN is_available BOOLEAN DEFAULT TRUE"
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
