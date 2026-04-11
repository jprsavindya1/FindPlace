const db = require("../db");

const migrationSql = `
  ALTER TABLE reservations 
  ADD COLUMN total_price DECIMAL(10, 2) DEFAULT 0.00 AFTER food_order_items;
`;

db.query(migrationSql, (err, result) => {
  if (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("✅ Column 'total_price' already exists. Skipping.");
      process.exit(0);
    }
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
  console.log("✅ Successfully added 'total_price' column to reservations table.");
  process.exit(0);
});
