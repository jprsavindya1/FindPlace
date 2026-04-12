const db = require("../db"); 

// Delete the conflicting record for Rashi on Table 1 for today
const sql = "DELETE FROM reservations WHERE res_date = '2026-04-12' AND table_id = 1 AND place_id = 24";

db.query(sql, (err, result) => {
  if (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
  console.log(`✅ Successfully removed ${result.affectedRows} conflicting reservation(s).`);
  process.exit(0);
});
