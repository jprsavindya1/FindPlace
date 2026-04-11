const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'SavindyaR31@S',
    database: 'findplace'
  });

  console.log('--- Starting Dual-Model Migrations (V2) ---');

  const addColumn = async (table, col, definition) => {
    try {
      const [cols] = await connection.execute(`SHOW COLUMNS FROM ${table} LIKE '${col}'`);
      if (cols.length === 0) {
        console.log(`Adding ${col} to ${table}...`);
        await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
      } else {
        console.log(`${col} already exists in ${table}.`);
      }
    } catch (e) {
      console.error(`Error adding ${col} to ${table}:`, e.message);
    }
  };

  try {
    // 1. users
    await addColumn('users', 'business_type', "ENUM('accommodation', 'dining') DEFAULT 'accommodation'");

    // 2. places
    await addColumn('places', 'cuisine_type', "VARCHAR(255)");
    await addColumn('places', 'table_capacity', "INT");
    await addColumn('places', 'opening_hours', "VARCHAR(100)");
    await addColumn('places', 'closing_hours', "VARCHAR(100)");

    // 3. menu
    await addColumn('menu', 'is_veg', "BOOLEAN DEFAULT FALSE");
    await addColumn('menu', 'is_special', "BOOLEAN DEFAULT FALSE");

    // 4. tables
    console.log('Creating restaurant_tables table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS restaurant_tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        place_id INT NOT NULL,
        table_no VARCHAR(50) NOT NULL,
        capacity INT NOT NULL,
        status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
        FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
      )
    `);

    // 5. reservations
    console.log('Creating reservations table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        place_id INT NOT NULL,
        user_id INT,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        res_date DATE NOT NULL,
        res_time TIME NOT NULL,
        people_count INT NOT NULL,
        table_id INT,
        status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
        FOREIGN KEY (table_id) REFERENCES restaurant_tables(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();
