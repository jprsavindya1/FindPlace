const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'SavindyaR31@S',
  database: 'findplace'
});

db.query("DESCRIBE places", (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(results, null, 2));
  db.end();
});
