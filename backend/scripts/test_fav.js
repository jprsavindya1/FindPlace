const db = require('./db');

db.query('SELECT * FROM users', (err, users) => {
  if (err || !users.length) {
    console.log('No users found', err);
    process.exit(1);
  }
  const userId = users[0].id;

  db.query('SELECT * FROM places', (err, places) => {
    if (err || !places.length) {
      console.log('No places found', err);
      process.exit(1);
    }
    const placeId = places[0].id;

    console.log(`Testing insert for user ${userId} and place ${placeId}`);
    
    db.query('INSERT IGNORE INTO favorites (user_id, place_id) VALUES (?, ?)', [userId, placeId], (err, res) => {
        if (err) console.error('INSERT ERROR:', err);
        else console.log('INSERT SUCCESS:', res);

        db.query('SELECT * FROM favorites', (err, favs) => {
            console.log('Favorites:', favs);
            process.exit(0);
        });
    });
  });
});
