require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/user.model');
const MenuItem = require('../models/menuItem.model');
const Cart = require('../models/cart.model');

// ─── Config ───────────────────────────────────────────────────────────────────
//
//  Cart is unique per user (unique: true on userId)
//  So max carts = total users = 500
//  We create one cart per user, each with a different scenario
//  so every API test case is covered with real, valid references.
//
// ─────────────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 100;

// ─── Scenarios ────────────────────────────────────────────────────────────────
//
//  Every cart belongs to a real userId and contains only real menuItemIds.
//  Scenarios are spread across users so you can test each API case in isolation.
//
//  Scenario A — single item,  qty=1          (users 0–49,   10%)  → minimal valid cart
//  Scenario B — single item,  qty=5          (users 50–99,  10%)  → qty > 1 single item
//  Scenario C — single item,  qty=10         (users 100–124, 5%)  → high qty single item
//  Scenario D — 2 items,      qty mix 1–3    (users 125–224, 20%) → small multi-item cart
//  Scenario E — 3–5 items,    qty mix 1–5    (users 225–374, 30%) → typical cart
//  Scenario F — 5–8 items,    qty mix 1–10   (users 375–449, 15%) → large cart
//  Scenario G — max 10 items, qty=1 each     (users 450–474, 5%)  → max items, min qty
//  Scenario H — max 10 items, qty=10 each    (users 475–499, 5%)  → max items, max qty
//
//  All menuItemIds are fetched from DB → 100% referential integrity guaranteed.
//  quantity is always >= 1 (satisfying schema min:1).
//
// ─────────────────────────────────────────────────────────────────────────────

function getScenario(userIndex) {
  if (userIndex < 50)  return { itemCount: 1,     minQty: 1,  maxQty: 1  }; // A
  if (userIndex < 100) return { itemCount: 1,     minQty: 5,  maxQty: 5  }; // B
  if (userIndex < 125) return { itemCount: 1,     minQty: 10, maxQty: 10 }; // C
  if (userIndex < 225) return { itemCount: 2,     minQty: 1,  maxQty: 3  }; // D
  if (userIndex < 375) return { itemCount: randInt(3, 5),  minQty: 1, maxQty: 5  }; // E
  if (userIndex < 450) return { itemCount: randInt(5, 8),  minQty: 1, maxQty: 10 }; // F
  if (userIndex < 475) return { itemCount: 10,    minQty: 1,  maxQty: 1  }; // G
  return                      { itemCount: 10,    minQty: 10, maxQty: 10 }; // H
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function pickUniqueItems(pool, count) {
  // Pick `count` unique menuItems from the pool (no duplicate menuItemId in one cart)
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

const seedCarts = async () => {
  try {
    await connectDB();

    // ── Fetch real IDs from DB ────────────────────────────────────────────────
    const users     = await User.find({ role: 'user' }, '_id').lean();
    const menuItems = await MenuItem.find({}, '_id restaurantId').lean();

    if (users.length === 0) {
      console.error('❌ No users found. Run user.seed.js first.');
      process.exit(1);
    }
    if (menuItems.length === 0) {
      console.error('❌ No menu items found. Run menuItem.seed.js first.');
      process.exit(1);
    }

    console.log(`✅ Found ${users.length} users and ${menuItems.length} menu items.\n`);

    // ── Build cart docs ───────────────────────────────────────────────────────
    const carts = [];

    users.forEach((user, index) => {
      const { itemCount, minQty, maxQty } = getScenario(index);

      // Pick unique real menu items — NO invalid IDs, NO duplicates
      const selectedItems = pickUniqueItems(menuItems, itemCount);

      const items = selectedItems.map((mi) => ({
        menuItemId: mi._id,               // 100% real ObjectId from DB
        quantity:   randInt(minQty, maxQty), // always >= 1
      }));

      carts.push({
        userId: user._id,
        items,
      });
    });

    // ── Insert in batches ─────────────────────────────────────────────────────
    let inserted = 0;
    for (let i = 0; i < carts.length; i += BATCH_SIZE) {
      const batch = carts.slice(i, i + BATCH_SIZE);
      await Cart.insertMany(batch, { ordered: false });
      inserted += batch.length;
      process.stdout.write(`\r  Inserted ${inserted}/${carts.length} carts...`);
    }

    console.log('\n');

    // ── Summary ───────────────────────────────────────────────────────────────
    const scenarioA = carts.filter((_, i) => i < 50).length;
    const scenarioB = carts.filter((_, i) => i >= 50  && i < 100).length;
    const scenarioC = carts.filter((_, i) => i >= 100 && i < 125).length;
    const scenarioD = carts.filter((_, i) => i >= 125 && i < 225).length;
    const scenarioE = carts.filter((_, i) => i >= 225 && i < 375).length;
    const scenarioF = carts.filter((_, i) => i >= 375 && i < 450).length;
    const scenarioG = carts.filter((_, i) => i >= 450 && i < 475).length;
    const scenarioH = carts.filter((_, i) => i >= 475).length;
    const totalItems = carts.reduce((sum, c) => sum + c.items.length, 0);

    console.log('════════════════════════════════════════════════════════════');
    console.log('                   CART SEED SUMMARY                       ');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`  Total carts inserted       : ${inserted}`);
    console.log(`  Total cart-item rows       : ${totalItems}`);
    console.log('────────────────────────────────────────────────────────────');
    console.log(`  A  Single item,  qty=1          : ${scenarioA} carts  → minimal valid cart`);
    console.log(`  B  Single item,  qty=5          : ${scenarioB} carts  → qty>1 single item`);
    console.log(`  C  Single item,  qty=10         : ${scenarioC} carts  → high qty single`);
    console.log(`  D  2 items,      qty 1–3        : ${scenarioD} carts  → small multi-item`);
    console.log(`  E  3–5 items,    qty 1–5        : ${scenarioE} carts  → typical cart`);
    console.log(`  F  5–8 items,    qty 1–10       : ${scenarioF} carts  → large cart`);
    console.log(`  G  10 items,     qty=1 each     : ${scenarioG} carts  → max items, min qty`);
    console.log(`  H  10 items,     qty=10 each    : ${scenarioH} carts  → max items, max qty`);
    console.log('────────────────────────────────────────────────────────────');
    console.log('  ✅ All menuItemIds are real DB references (no invalid IDs)');
    console.log('  ✅ All quantities satisfy schema min:1');
    console.log('  ✅ No duplicate menuItemId within any single cart');
    console.log('  ✅ Each user has exactly one cart (unique:true respected)');
    console.log('════════════════════════════════════════════════════════════\n');

    console.log('✅ Done — carts seeded successfully.');
    process.exit();
  } catch (error) {
    console.error('❌ Cart seeder failed:', error);
    process.exit(1);
  }
};

seedCarts();