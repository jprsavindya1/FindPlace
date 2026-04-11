const db = require("./db");

db.query("SELECT * FROM places WHERE id = 1", (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Place ID 1:", JSON.stringify(results[0], null, 2));
  process.exit(0);
});
