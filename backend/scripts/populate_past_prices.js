const db = require("../db");

async function populatePastPrices() {
  console.log("Starting to backfill total_price for past reservations with fallback...");

  const FALLBACK_PRICE = 1000; // Use 1000 for missing historical items

  try {
    // 1. Fetch menu prices
    const [menuRows] = await db.promise().query("SELECT id, price FROM menu");
    const menuMap = {};
    menuRows.forEach(item => {
      menuMap[item.id] = Number(item.price);
    });
    console.log(`Loaded ${menuRows.length} menu items with prices.`);

    // 2. Fetch reservations
    const [reservations] = await db.promise().query("SELECT id, food_order_items, total_price FROM reservations");
    console.log(`Found ${reservations.length} reservations to process.`);

    let updatedCount = 0;

    for (const res of reservations) {
      if (!res.total_price || Number(res.total_price) === 0) {
        try {
          if (!res.food_order_items) continue;

          const foodData = JSON.parse(res.food_order_items);
          let calculatedPrice = 0;

          if (typeof foodData === 'object' && !Array.isArray(foodData)) {
            for (const itemId in foodData) {
              const qty = Number(foodData[itemId]);
              const price = menuMap[itemId] || FALLBACK_PRICE; // FALLBACK HERE
              calculatedPrice += (price * qty);
            }
          } 
          else if (Array.isArray(foodData)) {
            calculatedPrice = foodData.reduce((sum, item) => {
              const price = Number(item.price) || FALLBACK_PRICE;
              const qty = Number(item.quantity) || 1;
              return sum + (price * qty);
            }, 0);
          }

          if (calculatedPrice > 0) {
            await db.promise().query("UPDATE reservations SET total_price = ? WHERE id = ?", [calculatedPrice, res.id]);
            updatedCount++;
            console.log(`Updated Res ID ${res.id}: Calculated Price = Rs. ${calculatedPrice} (Using fallback for some items if missing)`);
          }
        } catch (parseErr) {
          console.error(`Failed to process reservation ID ${res.id}:`, parseErr.message);
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} past reservations with calculated prices.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

populatePastPrices();
