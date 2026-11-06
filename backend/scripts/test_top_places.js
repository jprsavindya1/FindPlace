require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../db');
db.query(`
  SELECT p.id, p.name, p.location, p.district, p.image_url, p.rating, p.category,
         COUNT(b.id) as booking_count, COALESCE(SUM(b.total_price),0) as total_revenue
  FROM bookings b
  JOIN places p ON b.place_id = p.id
  WHERE b.status NOT IN ('CANCELLED','REJECTED')
  GROUP BY p.id, p.name, p.location, p.district, p.image_url, p.rating, p.category
  ORDER BY booking_count DESC
  LIMIT 6
`, (e, r) => {
  if (e) console.log('ERR:', e.message);
  else console.log(JSON.stringify(r, null, 2));
  process.exit();
});
