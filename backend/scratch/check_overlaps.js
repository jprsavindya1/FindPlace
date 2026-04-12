const mysql = require("mysql2"); 
const pool = mysql.createPool({ 
  host: "localhost", 
  user: "root", 
  password: "", 
  database: "find_place" 
}); 

pool.query("SELECT * FROM reservations WHERE res_date = '2026-04-12' AND place_id = 24", (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
});
