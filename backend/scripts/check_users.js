const db = require('./db');
const bcrypt = require('bcryptjs');

const usersToCheck = [
  { email: 'owner@findplace.com', password: 'owner123', role: 'owner' },
  { email: 'admin@findplace.com', password: 'admin123', role: 'admin' },
  { email: 'rashijayasekarajp@gmail.com', password: '123456', role: 'customer' }
];

const checkAll = async () => {
  for (const user of usersToCheck) {
    const sql = "SELECT * FROM users WHERE email = ? AND role = ? LIMIT 1";
    const results = await new Promise((resolve, reject) => {
      db.query(sql, [user.email, user.role], (err, res) => err ? reject(err) : resolve(res));
    });

    if (results.length === 0) {
      console.log(`❌ ${user.email} (${user.role}): NOT FOUND with this role`);
      continue;
    }

    const dbUser = results[0];
    const isMatch = await bcrypt.compare(user.password, dbUser.password);
    const isHashed = dbUser.password.startsWith('$2');

    console.log(`- ${user.email} (${user.role}):`);
    console.log(`  - Found in DB: Yes`);
    console.log(`  - Password is hashed correctly: ${isHashed ? 'Yes' : 'No (Raw: ' + dbUser.password + ')'}`);
    console.log(`  - Password matches provided credentials: ${isMatch ? 'Yes' : 'No'}`);
  }
  process.exit(0);
};

checkAll().catch(err => {
  console.error(err);
  process.exit(1);
});
