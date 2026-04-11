
const mysql = require("mysql2/promise");
require("dotenv").config();

async function updateCategories() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "SavindyaR31@S", 
    database: "findplace" 

  });

  try {
    console.log("Updating category 'Boarding Room' to 'Boarding House'...");
    const [result] = await connection.execute(
      "UPDATE places SET category = ? WHERE category = ?",
      ["Boarding House", "Boarding Room"]
    );
    console.log(`Updated ${result.affectedRows} properties.`);
  } catch (err) {
    console.error("Update failed:", err);
  } finally {
    await connection.end();
  }
}

updateCategories();
