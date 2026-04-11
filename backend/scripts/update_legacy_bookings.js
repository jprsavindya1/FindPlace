const db = require('./db');
db.query("UPDATE bookings SET status = 'CONFIRMED' WHERE status = 'PENDING'", (err, result) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log(`Legacy bookings updated. Affected rows: ${result.affectedRows}`);
    }
    process.exit(0);
});
