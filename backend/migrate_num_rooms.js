const db = require('./db');

const sql = `ALTER TABLE bookings ADD COLUMN num_rooms INT DEFAULT 1 AFTER children`;

db.query(sql, (err, result) => {
  if (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Column num_rooms already exists. Skipping migration.');
      process.exit(0);
    }
    console.error('Migration failed:', err);
    process.exit(1);
  }
  console.log('Migration successful: num_rooms column added.');
  process.exit(0);
});
