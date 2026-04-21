const db = require("../db");

const createItinerariesTable = `
CREATE TABLE IF NOT EXISTS itineraries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    data LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (user_id)
);
`;

db.query(createItinerariesTable, (err, results) => {
    if (err) {
        console.error("❌ Error creating itineraries table:", err);
        process.exit(1);
    }
    console.log("✅ itineraries table created or already exists.");
    process.exit(0);
});
