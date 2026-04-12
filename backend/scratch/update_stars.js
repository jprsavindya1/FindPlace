const db = require("../db");

const updates = [
  { id: 3, stars: 5 },
  { id: 5, stars: 4 },
  { id: 7, stars: 3 },
  { id: 10, stars: 2 },
  { id: 13, stars: 1 },
  { id: 20, stars: 5 }
];

const updatePlace = (update) => {
  return new Promise((resolve, reject) => {
    db.query("UPDATE places SET stars = ? WHERE id = ?", [update.stars, update.id], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

Promise.all(updates.map(updatePlace))
  .then(() => {
    console.log("Successfully updated star ratings for example places.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Update failed:", err);
    process.exit(1);
  });
