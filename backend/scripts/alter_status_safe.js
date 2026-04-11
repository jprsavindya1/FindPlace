const db = require('./db');

async function migrateStatus() {
    console.log("Starting status migration...");
    try {
        await new Promise((res, rej) => db.query("ALTER TABLE bookings MODIFY COLUMN status VARCHAR(50);", (e) => e ? rej(e) : res()));
        console.log("Converted status to VARCHAR");
        
        await new Promise((res, rej) => db.query("UPDATE bookings SET status = UPPER(status);", (e) => e ? rej(e) : res()));
        console.log("Updated rows to uppercase");
        
        await new Promise((res, rej) => db.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING';", (e) => e ? rej(e) : res()));
        console.log("Converted back to rich ENUM successfully");
        
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrateStatus();
