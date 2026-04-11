const db = require('./db');

// Sequence of ALTER statements
const queries = [
    // 1. Add total_price (if not exists)
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0.00;`,
    
    // 2. Add room_id (if not exists)
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS room_id INT DEFAULT NULL;`,
    
    // 3. Add customer details
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT NULL;`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL;`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT NULL;`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS identity VARCHAR(100) DEFAULT NULL;`,
    
    // 4. Add guests count
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adults INT DEFAULT 1;`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS children INT DEFAULT 0;`,
    
    // 5. Modify status ENUM
    `ALTER TABLE bookings MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING';` // Kept APPROVED for backwards compat during migration if needed, but PENDING is new default. Update: FindPlace was using 'APPROVED' instead of 'CONFIRMED'. Adding them all.
];

console.log("Starting DB migration for bookings...");

db.connect(async (err) => {
    if (err) {
        console.error("Connection failed", err);
        process.exit(1);
    }
    
    for (const q of queries) {
        try {
            await new Promise((resolve, reject) => {
                db.query(q, (err, res) => {
                    if (err) reject(err);
                    else {
                        console.log("Success:", q.substring(0, 50) + "...");
                        resolve();
                    }
                });
            });
        } catch (error) {
           // Ignore duplicate column errors or syntax differences if they already exist
           if (error.code !== 'ER_DUP_FIELDNAME') {
               console.error("Error executing query:", q);
               console.error(error.message);
           } else {
               console.log("Column already exists, skipping:", q.substring(0, 50) + "...");
           }
        }
    }
    
    console.log("Migration complete.");
    process.exit(0);
});
