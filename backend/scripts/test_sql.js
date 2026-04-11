const db = require('./db');

const sql = `
  SELECT 
    b.id,
    p.name AS place_name,
    r.name AS room_name,
    u.name AS customer_name,
    b.full_name,
    b.email,
    b.phone,
    b.identity,
    b.adults,
    b.children,
    b.total_price,
    b.check_in,
    b.check_out,
    b.status,
    b.created_at
  FROM bookings b
  JOIN places p ON b.place_id = p.id
  LEFT JOIN rooms r ON b.room_id = r.id
  JOIN users u ON b.customer_id = u.id
  WHERE b.owner_id = 9
`;

db.query(sql, (err, results) => {
  if (err) {
    console.error("SQL Error:", err.message);
  } else {
    console.log("Success. Rows:", results.length);
    console.log(results);
  }
  process.exit(0);
});
