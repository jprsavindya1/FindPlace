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

    const sql = "ALTER TABLE rooms ADD COLUMN total_rooms INT DEFAULT 5 AFTER price";

    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
                console.log('Column total_rooms already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column total_rooms added successfully.');
        }
        db.end();
    });
});
