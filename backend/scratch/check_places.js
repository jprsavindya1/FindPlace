const db = require("../db");

db.query("SELECT id, name, stars FROM places LIMIT 20", (err, results) => {
  if (err) {
    console.error("Query failed:", err);
    process.exit(1);
  }
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
});
