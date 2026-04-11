const mysql = require("mysql2/promise");
require("dotenv").config();

async function addDiningCols() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "SavindyaR31@S",
    database: "findplace"
  });

  try {
    console.log("Checking for existing columns...");
    const [rows] = await connection.execute("DESCRIBE places");
    const fields = rows.map(r => r.Field);

    if (!fields.includes("type")) {
      console.log("Adding 'type' column...");
      await connection.execute("ALTER TABLE places ADD COLUMN type ENUM('stay', 'dine') DEFAULT 'stay' AFTER owner_id");
    }

    if (!fields.includes("ambience")) {
      console.log("Adding 'ambience' column...");
      await connection.execute("ALTER TABLE places ADD COLUMN ambience TEXT AFTER extra_rules");
    }

    if (!fields.includes("featured_dishes")) {
      console.log("Adding 'featured_dishes' column...");
      await connection.execute("ALTER TABLE places ADD COLUMN featured_dishes TEXT AFTER ambience");
    }

    // Set existing categories like Restaurant, Fine Dining, etc. to 'dine' type
    console.log("Updating 'type' for dining establishments...");
    await connection.execute(`
      UPDATE places 
      SET type = 'dine' 
      WHERE category IN ('Restaurant', 'Fine Dining', 'Beach Bar', 'Cafe', 'Buffet')
    `);

    console.log("Database schema updated successfully.");
  } catch (err) {
    console.error("Schema update failed:", err);
  } finally {
    await connection.end();
  }
}

addDiningCols();
