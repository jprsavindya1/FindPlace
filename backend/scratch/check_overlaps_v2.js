const db = require("./db"); 

db.query("SELECT id, res_date, res_time, status, table_id FROM reservations WHERE res_date = '2026-04-12' AND place_id = 24", (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("RESERVATIONS FOR 2026-04-12 AT PLACE 24:");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
});
