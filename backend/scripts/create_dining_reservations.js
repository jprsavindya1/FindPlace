const db = require('./db');

const sql = `
CREATE TABLE IF NOT EXISTS dining_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  owner_id INT,
  place_id INT,
  table_id INT,
  reservation_date DATE,
  reservation_time VARCHAR(50),
  party_size INT,
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  special_requests TEXT,
  status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.query(sql, (err, result) => {
  if (err) {
    console.error("Error creating dining_reservations table:", err);
  } else {
    console.log("dining_reservations table created successfully!");
  }
  process.exit(0);
});
