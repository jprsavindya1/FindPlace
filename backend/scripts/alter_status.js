const db = require('./db');

// In MySQL, let's keep the existing cases to prevent truncation, and just add new ones
const alterQuery = `ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'PENDING', 'APPROVED', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING';`;

db.query(alterQuery, (err, res) => {
    if (err) {
        console.error("Failed to alter status:", err.message);
    } else {
        console.log("Status column altered successfully");
    }
    process.exit(0);
});
