const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'findplace'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL.');

    const updates = [
        { name: 'Triple Room', capacity: 3 },
        { name: 'Family Suite', capacity: 4 },
        { name: 'Full Villa', capacity: 8 },
        { name: 'Double Room', capacity: 2 },
        { name: 'Standard Room', capacity: 2 },
        { name: 'Deluxe Room', capacity: 2 }
    ];

    let completed = 0;
    updates.forEach(upd => {
        const sql = "UPDATE rooms SET capacity = ? WHERE name LIKE ?";
        db.query(sql, [upd.capacity, `%${upd.name}%`], (err, result) => {
            if (err) console.error(`Error updating ${upd.name}:`, err);
            else console.log(`Updated capacity for ${upd.name} rooms.`);
            
            completed++;
            if (completed === updates.length) {
                db.end();
                console.log('All data fixes completed.');
            }
        });
    });
});
