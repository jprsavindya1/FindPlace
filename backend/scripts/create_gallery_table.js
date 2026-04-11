const mysql = require('mysql2');
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'SavindyaR31@S',
  database: 'findplace'
};

const connection = mysql.createConnection(dbConfig);

const createGalleryTable = `
CREATE TABLE IF NOT EXISTS place_gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  place_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);
`;

connection.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');

  connection.query(createGalleryTable, (error, results, fields) => {
    if (error) throw error;
    console.log('place_gallery table created or already exists.');
    connection.end();
  });
});
