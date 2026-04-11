const db = require('./db');

db.query('DESCRIBE bookings', (err, result) => {
    if (err) {
        console.error("Error describing bookings:", err);
        process.exit(1);
    }
    console.log("Bookings Schema:", result);
    process.exit(0);
});
