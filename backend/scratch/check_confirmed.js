const db = require("../db"); 

db.query("SELECT * FROM reservations WHERE status = 'confirmed' ORDER BY res_date DESC, res_time DESC LIMIT 20", (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("LAST 20 CONFIRMED RESERVATIONS:");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
});
