const db = require('../db');

const menuItems = [
  // Appetizers
  { name: 'Crispy Golden Prawns', price: 1200, category: 'Appetizers' },
  { name: 'Garlic Butter Mushrooms', price: 950, category: 'Appetizers' },
  { name: 'Classic Chicken Wings', price: 1100, category: 'Appetizers' },
  { name: 'Vegetable Spring Rolls', price: 800, category: 'Appetizers' },
  // Main Course
  { name: 'Signature Seafood Rice', price: 2200, category: 'Main Course' },
  { name: 'Grilled Chicken with Herb Sauce', price: 1850, category: 'Main Course' },
  { name: 'Creamy Pasta Carbonara', price: 1600, category: 'Main Course' },
  { name: 'Beef Steak with Veggies', price: 2800, category: 'Main Course' },
  { name: 'Mixed Grill Platter', price: 3500, category: 'Main Course' },
  // Snacks
  { name: 'Cheesy French Fries', price: 750, category: 'Snacks' },
  { name: 'Golden Fried Nuggets', price: 850, category: 'Snacks' },
  { name: 'Spicy Potato Wedges', price: 650, category: 'Snacks' },
  { name: 'Club Sandwich', price: 1200, category: 'Snacks' },
  // Dessert
  { name: 'Chocolate Lava Cake', price: 950, category: 'Desserts' },
  { name: 'Vanilla Bean Nuggets', price: 550, category: 'Desserts' },
  { name: 'Fruit Salad with Jelly', price: 650, category: 'Desserts' },
  { name: 'Creamy Caramel Pudding', price: 700, category: 'Desserts' },
  // Beverages
  { name: 'Fresh Lime Juice', price: 450, category: 'Drinks' },
  { name: 'Iced Coffee with Ice Cream', price: 650, category: 'Drinks' },
  { name: 'The Golden Mocktail', price: 650, category: 'Drinks' },
  { name: 'Hot Ceylon Tea', price: 250, category: 'Drinks' }
];

const placeId = 24;

async function updateMenu() {
  console.log(`Starting menu update for Place ID ${placeId}...`);

  // Delete old items
  await new Promise((resolve, reject) => {
    db.query('DELETE FROM menu WHERE place_id = ?', [placeId], (err, results) => {
      if (err) return reject(err);
      console.log(`Deleted ${results.affectedRows} old menu items.`);
      resolve();
    });
  });

  // Insert new items
  for (const item of menuItems) {
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO menu (place_id, name, price, category) VALUES (?, ?, ?, ?)',
        [placeId, item.name, item.price, item.category],
        (err, results) => {
          if (err) return reject(err);
          console.log(`Inserted: ${item.name}`);
          resolve();
        }
      );
    });
  }

  console.log('Menu update completed successfully!');
  process.exit(0);
}

updateMenu().catch(err => {
  console.error('Error updating menu:', err);
  process.exit(1);
});
