const mysql = require('mysql2');
require('dotenv').config({ path: './backend/.env' });

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

    const sql = "ALTER TABLE rooms ADD COLUMN image_360 VARCHAR(255) DEFAULT NULL AFTER description";

    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
                console.log('Column image_360 already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column image_360 added successfully.');
        }
        db.end();
    });
});
