const db = require('./db');

const sql = `ALTER TABLE reservations ADD COLUMN food_order_items TEXT NULL;`;

db.query(sql, (err, results) => {
  if (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("Column 'food_order_items' already exists.");
    } else {
      console.error("Error adding column:", err);
    }
  } else {
    console.log("Column 'food_order_items' added successfully to reservations table.");
  }
  process.exit();
});
