const db = require('./db');

db.query('DELETE FROM bookings', (err) => {
    if (err) {
        console.error("Error deleting bookings:", err.message);
    } else {
        console.log("All legacy bookings successfully deleted.");
        // reset auto increment
        db.query('ALTER TABLE bookings AUTO_INCREMENT = 1', (err2) => {
             if(err2) console.error("Could not reset AI", err2.message);
             else console.log("Auto increment reset to 1");
             process.exit(0);
        });
    }
});
