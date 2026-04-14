const db = require('../db');
db.query("DESCRIBE places", (err, res) => {
    if(!err) console.log("places columns:", res.map(r => r.Field));
    process.exit(0);
});
