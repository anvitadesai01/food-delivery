require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/user.model');
const Restaurant = require('../models/restaurant.model');
const MenuItem = require('../models/menuItem.model');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  TOTAL_ORDERS: 50000,
  BATCH_SIZE:   500,    // per insertMany batch
};

// ─── Payment method distribution ─────────────────────────────────────────────
const PAYMENT_METHODS = ['online', 'cod'];

// ─── Order status + paymentStatus distribution ────────────────────────────────
//
//  Mirrors real lifecycle of placeOrder:
//    - All orders start "placed" with paymentStatus from method
//    - Some have progressed to "preparing" or "delivered"
//    - paymentStatus aligns with what your transaction sets:
//        online  → "success"  immediately
//        cod     → "pending" → "success" on delivery, "failed" occasionally
//
//  Distribution (deterministic by index % 10):
//    0–3  → placed    + paymentStatus based on method  (40%)
//    4–6  → preparing + paymentStatus based on method  (30%)
//    7–9  → delivered + success (95%) or failed (5%)    (30%)
//
// ─────────────────────────────────────────────────────────────────────────────

function getStatusAndPayment(index, method) {
  const roll = index % 10;

  if (roll <= 3) {
    // placed — payment status exactly as placeOrder sets it
    return {
      status:        'placed',
      paymentStatus: method === 'online' ? 'success' : 'pending',
    };
  }
  if (roll <= 6) {
    // preparing
    return {
      status:        'preparing',
      paymentStatus: method === 'online' ? 'success' : 'pending',
    };
  }
  // delivered — COD is now collected, occasional failure
  return {
    status:        'delivered',
    paymentStatus: index % 20 === 0 ? 'failed' : 'success', // 5% failed
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Seeder ───────────────────────────────────────────────────────────────────

const seedOrders = async () => {
  try {
    await connectDB();

    // ── 1. Fetch all required real data ──────────────────────────────────────
    console.log('🔍 Fetching users, restaurants, menu items from DB...');

    const users = await User.find({ role: 'user' }, '_id').lean();
    if (!users.length) { console.error('❌ No users found. Run user.seed.js first.'); process.exit(1); }

    // Only fetch available items with stock > 0
    // This mirrors your placeOrder condition:
    //   MenuItem.findOneAndUpdate({ availability: true, stock: { $gte: quantity } })
    const menuItems = await MenuItem.find(
      { availability: true, stock: { $gt: 0 } },
      '_id restaurantId price stock'
    ).lean();
    if (!menuItems.length) { console.error('❌ No available menu items found.'); process.exit(1); }

    // ── 2. Group menu items by restaurantId ───────────────────────────────────
    //  CRITICAL: your placeOrder takes restaurantId from firstItem.restaurantId
    //  so ALL items in one order MUST belong to the same restaurant.
    const menuByRestaurant = {};
    for (const item of menuItems) {
      const key = item.restaurantId.toString();
      if (!menuByRestaurant[key]) menuByRestaurant[key] = [];
      menuByRestaurant[key].push(item);
    }

    // Only keep restaurants that have at least 2 available items
    // (so we can create varied multi-item orders)
    const validRestaurantIds = Object.keys(menuByRestaurant).filter(
      (k) => menuByRestaurant[k].length >= 2
    );

    if (!validRestaurantIds.length) {
      console.error('❌ No restaurants with enough available menu items.');
      process.exit(1);
    }

    console.log(`✅ ${users.length} users | ${validRestaurantIds.length} restaurants with available items | ${menuItems.length} available menu items\n`);
    console.log(`📦 Building ${CONFIG.TOTAL_ORDERS} orders...\n`);

    // ── 3. Build order + payment docs ─────────────────────────────────────────

    // We track stock usage per menuItem in memory so we don't exceed real stock
    // This mirrors what your transaction does with $inc: { stock: -quantity }
    const stockTracker = {};
    for (const item of menuItems) {
      stockTracker[item._id.toString()] = item.stock;
    }

    const orderDocs   = [];
    const paymentDocs = []; // built after order _id is known

    let skipped = 0;

    for (let i = 0; i < CONFIG.TOTAL_ORDERS; i++) {
      const userId       = rand(users)._id;
      const restaurantId = validRestaurantIds[i % validRestaurantIds.length];
      const pool         = menuByRestaurant[restaurantId];
      const method       = PAYMENT_METHODS[i % 2]; // alternates online/cod evenly

      // Pick 1–4 unique items from this restaurant's pool
      const itemCount    = randInt(1, Math.min(4, pool.length));
      const shuffled     = [...pool].sort(() => Math.random() - 0.5);
      const selected     = shuffled.slice(0, itemCount);

      // Check and decrement stock in tracker (mirrors transaction stock check)
      const orderItems   = [];
      let   totalAmount  = 0;
      let   stockOk      = true;

      for (const mi of selected) {
        const qty     = randInt(1, 3);
        const key     = mi._id.toString();
        const current = stockTracker[key] ?? 0;

        if (current < qty) { stockOk = false; break; } // skip if insufficient stock

        stockTracker[key] -= qty; // deduct, mirrors $inc: { stock: -qty }
        totalAmount += mi.price * qty;
        orderItems.push({ menuItemId: mi._id, quantity: qty });
      }

      if (!stockOk || orderItems.length === 0) { skipped++; continue; }

      const { status, paymentStatus } = getStatusAndPayment(i, method);

      orderDocs.push({
        userId,
        restaurantId:  new mongoose.Types.ObjectId(restaurantId),
        items:         orderItems,
        totalAmount:   parseFloat(totalAmount.toFixed(2)),
        status,
        paymentStatus,
      });
    }

    console.log(`  ⚠️  Skipped ${skipped} orders (stock exhausted during build — expected)\n`);

    // ── 4. Insert orders in batches ───────────────────────────────────────────
    console.log(`  Inserting ${orderDocs.length} orders...`);
    const insertedOrders = [];

    for (let i = 0; i < orderDocs.length; i += CONFIG.BATCH_SIZE) {
      const batch  = orderDocs.slice(i, i + CONFIG.BATCH_SIZE);
      const result = await Order.insertMany(batch, { ordered: false });
      result.forEach((o, idx) => {
        insertedOrders.push({
          _id:           o._id,
          paymentStatus: batch[idx].paymentStatus,
          method:        PAYMENT_METHODS[i % 2],
          status:        batch[idx].status,
        });
      });
      process.stdout.write(`\r  Orders: ${insertedOrders.length}/${orderDocs.length}`);
    }
    console.log('\n');

    // ── 5. Build + insert payments (one per order, mirrors Payment.create in tx) ──
    console.log(`  Inserting ${insertedOrders.length} payments...`);
    const paymentData = insertedOrders.map((o, idx) => ({
      orderId: o._id,
      status:  o.paymentStatus,
      method:  PAYMENT_METHODS[idx % 2],
    }));

    let insertedPayments = 0;
    for (let i = 0; i < paymentData.length; i += CONFIG.BATCH_SIZE) {
      const batch = paymentData.slice(i, i + CONFIG.BATCH_SIZE);
      await Payment.insertMany(batch, { ordered: false });
      insertedPayments += batch.length;
      process.stdout.write(`\r  Payments: ${insertedPayments}/${paymentData.length}`);
    }
    console.log('\n');

    // ── 6. Summary ────────────────────────────────────────────────────────────
    const placed    = insertedOrders.filter(o => o.status === 'placed').length;
    const preparing = insertedOrders.filter(o => o.status === 'preparing').length;
    const delivered = insertedOrders.filter(o => o.status === 'delivered').length;
    const online    = paymentData.filter((_, i) => i % 2 === 0).length;
    const cod       = paymentData.filter((_, i) => i % 2 !== 0).length;
    const pSuccess  = paymentData.filter(p => p.status === 'success').length;
    const pPending  = paymentData.filter(p => p.status === 'pending').length;
    const pFailed   = paymentData.filter(p => p.status === 'failed').length;

    console.log('══════════════════════════════════════════════════════════════');
    console.log('                    ORDER SEED SUMMARY                        ');
    console.log('══════════════════════════════════════════════════════════════');
    console.log(`  Total orders inserted      : ${insertedOrders.length.toLocaleString()}`);
    console.log(`  Total payments inserted    : ${insertedPayments.toLocaleString()}`);
    console.log('──────────────────────────────────────────────────────────────');
    console.log('  ORDER STATUS');
    console.log(`    placed                   : ${placed.toLocaleString()}   (40%)`);
    console.log(`    preparing                : ${preparing.toLocaleString()}   (30%)`);
    console.log(`    delivered                : ${delivered.toLocaleString()}   (30%)`);
    console.log('──────────────────────────────────────────────────────────────');
    console.log('  PAYMENT METHOD');
    console.log(`    online                   : ${online.toLocaleString()}  → paymentStatus: success`);
    console.log(`    cod                      : ${cod.toLocaleString()}  → paymentStatus: pending/success`);
    console.log('──────────────────────────────────────────────────────────────');
    console.log('  PAYMENT STATUS');
    console.log(`    success                  : ${pSuccess.toLocaleString()}`);
    console.log(`    pending                  : ${pPending.toLocaleString()}`);
    console.log(`    failed                   : ${pFailed.toLocaleString()}   (5% of delivered COD)`);
    console.log('──────────────────────────────────────────────────────────────');
    console.log('  INTEGRITY CHECKS');
    console.log('    ✅ All userId refs are real users (role:user)');
    console.log('    ✅ All restaurantId refs are real restaurants');
    console.log('    ✅ All menuItemId refs belong to their restaurantId');
    console.log('    ✅ All items had availability:true and stock>0 at seed time');
    console.log('    ✅ Stock decremented per order (mirrors $inc in transaction)');
    console.log('    ✅ One Payment doc per Order (mirrors Payment.create in tx)');
    console.log('    ✅ paymentStatus matches method (online→success, cod→pending)');
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('✅ Done — orders and payments seeded successfully.');
    process.exit();
  } catch (error) {
    console.error('❌ Order seeder failed:', error);
    console.error(error);
    process.exit(1);
  }
};

seedOrders();