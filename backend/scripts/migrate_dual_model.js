const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'SavindyaR31@S',
    database: 'findplace'
  });

  console.log('--- Starting Dual-Model Migrations ---');

  try {
    // 1. Update users table
    console.log('Updating users table...');
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS business_type ENUM('accommodation', 'dining') DEFAULT 'accommodation'
    `);

    // 2. Update places table
    console.log('Updating places table...');
    await connection.execute(`
      ALTER TABLE places 
      ADD COLUMN IF NOT EXISTS cuisine_type VARCHAR(255),
      ADD COLUMN IF NOT EXISTS table_capacity INT,
      ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(100),
      ADD COLUMN IF NOT EXISTS closing_hours VARCHAR(100)
    `);

    // 3. Update menu table
    console.log('Updating menu table...');
    await connection.execute(`
      ALTER TABLE menu 
      ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT FALSE
    `);

    // 4. Create tables table
    console.log('Creating tables table...');
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

    // 5. Create reservations table
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
