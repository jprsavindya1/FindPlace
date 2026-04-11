const db = require('./db');

db.query("DESCRIBE places", (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.table(results);
  process.exit(0);
});
