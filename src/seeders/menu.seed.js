require('dotenv').config();
const connectDB = require('../config/db');
const Restaurant = require('../models/restaurant.model');
const MenuItem = require('../models/menuItem.model');

// ─── Menu Items per Cuisine ───────────────────────────────────────────────────

const MENU_BY_CUISINE = {
  'North Indian': [
    'Butter Chicken','Dal Makhani','Paneer Tikka','Chole Bhature','Rajma Chawal',
    'Palak Paneer','Aloo Gobi','Kadai Paneer','Shahi Paneer','Naan',
    'Garlic Naan','Laccha Paratha','Tandoori Roti','Jeera Rice','Pulao',
    'Dal Tadka','Matar Paneer','Aloo Matar','Baingan Bharta','Malai Kofta',
    'Lassi','Mango Lassi','Chaas','Raita','Kheer',
  ],
  'South Indian': [
    'Masala Dosa','Plain Dosa','Rava Dosa','Set Dosa','Idli Sambar',
    'Medu Vada','Uttapam','Pongal','Rasam','Curd Rice',
    'Pesarattu','Filter Coffee','Payasam','Bisibelebath','Tamarind Rice',
    'Lemon Rice','Coconut Rice','Sambar Vada','Mysore Masala Dosa','Paniyaram',
    'Appam','Stew','Puttu','Kadala Curry','Sabudana Khichdi',
  ],
  'Chinese': [
    'Veg Fried Rice','Chicken Fried Rice','Hakka Noodles','Veg Manchurian',
    'Chicken Manchurian','Spring Roll','Chow Mein','Dim Sum',
    'Hot and Sour Soup','Wonton Soup','Schezwan Rice','Kung Pao Chicken',
    'Chilli Paneer','Chilli Chicken','Momos','Fried Momos','Pan Fried Momos',
    'Honey Chilli Potato','Crispy Corn','Dragon Chicken','Szechuan Noodles',
    'Vegetable Clear Soup','Sweet Corn Soup','Lollipop Chicken','Baby Corn Manchurian',
  ],
  'Biryani': [
    'Chicken Biryani','Mutton Biryani','Veg Biryani','Egg Biryani',
    'Hyderabadi Dum Biryani','Lucknowi Biryani','Kolkata Biryani','Prawn Biryani',
    'Fish Biryani','Paneer Biryani','Mushroom Biryani','Keema Biryani',
    'Raita','Mirchi ka Salan','Salan','Phirni','Double Ka Meetha',
    'Sheer Khurma','Haleem','Nihari','Paya','Korma',
    'Qorma','Shami Kebab','Seekh Kebab','Boti Kebab',
  ],
  'Fast Food': [
    'Veg Burger','Chicken Burger','Aloo Tikki Burger','Zinger Burger',
    'Margherita Pizza','Farmhouse Pizza','Pepperoni Pizza','BBQ Chicken Pizza',
    'French Fries','Peri Peri Fries','Cheese Fries','Hot Dog',
    'Veg Sandwich','Club Sandwich','Grilled Sandwich','Wrap',
    'Chicken Nuggets','Onion Rings','Pasta Arrabbiata','Mac and Cheese',
    'Garlic Bread','Cheesy Dip','Cold Drink','Milkshake','Sundae',
  ],
  'Street Food': [
    'Pav Bhaji','Vada Pav','Bhel Puri','Sev Puri','Pani Puri',
    'Dahi Puri','Ragda Pattice','Misal Pav','Kachori','Samosa',
    'Aloo Chaat','Papdi Chaat','Dahi Bhalla','Golgappa','Tikki Chaat',
    'Dabeli','Frankie','Kathi Roll','Egg Roll','Ghugni Chaat',
    'Jhalmuri','Churmur','Litti Chokha','Thekua','Makhana',
  ],
  'Mughlai': [
    'Mutton Rogan Josh','Chicken Korma','Lamb Seekh Kebab','Boti Kebab',
    'Murgh Musallam','Dum Pukht','Shahi Tukda','Firni','Sewaiyan',
    'Nargisi Kofta','Galouti Kebab','Kakori Kebab','Biryani','Pulao',
    'Sheermal','Roomali Roti','Warqi Paratha','Nihari','Haleem','Paya',
    'Qeema','Mutton Liver','Brain Masala','Trotters','Shammi Kebab',
  ],
  'Tandoori': [
    'Tandoori Chicken','Tandoori Paneer','Tandoori Fish','Chicken Tikka',
    'Paneer Tikka','Mutton Seekh','Veg Seekh','Achari Tikka',
    'Malai Tikka','Hariyali Tikka','Tandoori Jhinga','Chicken Reshmi',
    'Murgh Malai','Banjara Chicken','Peshwari Chicken','Raan',
    'Kalmi Kebab','Burra Kebab','Tandoori Aloo','Tandoori Gobi',
    'Tandoori Mushroom','Stuffed Capsicum','Corn Seekh','Mix Grill','Tandoori Platter',
  ],
  'Gujarati': [
    'Dhokla','Khandvi','Thepla','Methi Thepla','Fafda',
    'Jalebi','Undhiyu','Sev Tameta','Gujarati Dal','Kadhi',
    'Khichdi','Rotla','Puri','Shrikhand','Basundi',
    'Mohanthal','Sukhdi','Ghari','Chakli','Gathiya',
    'Handvo','Muthia','Dabeli','Sev Khamani','Adadiya',
  ],
  'Rajasthani': [
    'Dal Baati Churma','Laal Maas','Gatte ki Sabzi','Ker Sangri',
    'Bajra Roti','Missi Roti','Rajasthani Kadhi','Panchkuta','Papad ki Sabzi',
    'Ghevar','Malpua','Balushahi','Rasgulla','Gulab Jamun',
    'Mohan Maas','Safed Maas','Jungli Maas','Bajre ka Khichda','Rabdi',
    'Makke ki Roti','Sarson ka Saag','Churma Ladoo','Besan Ladoo','Pinni',
  ],
  'Bengali': [
    'Machher Jhol','Kosha Mangsho','Chingri Malai Curry','Ilish Bhapa',
    'Aloo Posto','Shorshe Ilish','Dhokar Dalna','Cholar Dal','Luchi',
    'Mishti Doi','Sandesh','Rasgulla','Chomchom','Pantua',
    'Macher Kalia','Prawn Malai','Hilsa Fish Fry','Beguni','Fuluri',
    'Ghugni','Jhal Muri','Kochuri','Radhaballabhi','Mughlai Paratha',
  ],
  'Punjabi': [
    'Sarson ka Saag','Makke ki Roti','Chole','Amritsari Kulcha',
    'Pindi Chole','Amritsari Fish','Tandoori Chicken','Butter Chicken',
    'Dal Makhani','Paneer Bhurji','Lassi','Pinni',
    'Gajar ka Halwa','Kada Prasad','Langar Wali Dal','Rajma',
    'Aloo Paratha','Gobhi Paratha','Mooli Paratha','Stuffed Paratha',
    'Murgh Makhani','Mutton Curry','Paya','Nihari','Shami Kebab',
  ],
  'Kerala': [
    'Fish Curry','Prawn Masala','Chicken Stew','Appam',
    'Puttu Kadala','Kerala Porotta','Beef Fry','Karimeen Pollichathu',
    'Meen Moilee','Avial','Thoran','Olan',
    'Kootu Curry','Erissery','Sambar','Rasam',
    'Payasam','Halwa','Unniyappam','Ela Ada',
    'Palada Pradhaman','Ada Pradhaman','Chakka Pradhaman','Semiya Payasam','Pal Payasam',
  ],
  'Seafood': [
    'Grilled Fish','Fish and Chips','Prawn Curry','Prawn Masala',
    'Crab Masala','Lobster Thermidor','Squid Rings','Calamari',
    'Fish Tikka','Fish Fry','Tandoori Prawn','Butter Garlic Prawn',
    'Crab Butter Garlic','Mussels','Clams','Oysters',
    'Fish Biryani','Prawn Biryani','Crab Biryani','Seafood Platter',
    'Fish Soup','Prawn Soup','Seafood Pasta','Prawn Tempura','Fish Tacos',
  ],
  'Italian': [
    'Margherita Pizza','Quattro Formaggi','Carbonara Pasta','Aglio e Olio',
    'Penne Arrabbiata','Lasagna','Risotto','Bruschetta',
    'Caprese Salad','Caesar Salad','Minestrone Soup','Tiramisu',
    'Panna Cotta','Gelato','Cannoli','Focaccia',
    'Ravioli','Gnocchi','Osso Buco','Saltimbocca',
    'Veal Milanese','Chicken Parmigiana','Eggplant Parmigiana','Calzone','Stromboli',
  ],
  'Continental': [
    'Grilled Chicken','Chicken Steak','Beef Steak','Lamb Chops',
    'Baked Fish','Chicken Alfredo','Mushroom Risotto','Vegetable Quiche',
    'French Onion Soup','Tomato Bisque','Garden Salad','Greek Salad',
    'Coleslaw','Mashed Potatoes','Roasted Vegetables','Garlic Bread',
    'Chocolate Lava Cake','Cheesecake','Apple Pie','Creme Brulee',
    'Pavlova','Mousse','Brownie','Waffle','Crepe',
  ],
  'default': [
    'Chef Special','Daily Thali','Mix Platter','Seasonal Special',
    'House Salad','Soup of the Day','Grilled Platter','Veg Platter',
    'Non-Veg Platter','Dessert Platter','Fresh Juice','Mocktail',
    'Tea','Coffee','Mineral Water','Lassi',
    'Raita','Papad','Pickle','Chutney',
    'Ice Cream','Kulfi','Gulab Jamun','Halwa','Kheer',
  ],
};

// ─── Config ───────────────────────────────────────────────────────────────────

const ITEMS_PER_RESTAURANT = 25;   // 1000 restaurants × 25 = 25,000 menu items
const BATCH_SIZE = 500;

// ─── Stock / Availability Scenarios ──────────────────────────────────────────
// Weighted distribution so your API tests cover all edge cases:
//
//  Scenario A — available + good stock  (55%) → normal order flow works
//  Scenario B — available + low stock   (15%) → stock boundary tests
//  Scenario C — available + zero stock  (10%) → available=true but stock=0 (edge case)
//  Scenario D — unavailable + has stock (10%) → availability=false overrides stock
//  Scenario E — unavailable + no stock  (10%) → fully out
//
// This gives you realistic data AND full coverage for your availability/stock APIs.

function getStockAndAvailability(index) {
  const roll = index % 20; // deterministic so every restaurant gets all scenarios
  if (roll < 11) return { availability: true,  stock: randInt(20, 200) };  // A: 55%
  if (roll < 14) return { availability: true,  stock: randInt(1, 10)   };  // B: 15%
  if (roll < 16) return { availability: true,  stock: 0                };  // C: 10%
  if (roll < 18) return { availability: false, stock: randInt(10, 100) };  // D: 10%
  return            { availability: false, stock: 0                };  // E: 10%
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand      = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

function getItemPool(cuisines) {
  for (const c of cuisines) {
    if (MENU_BY_CUISINE[c]) return MENU_BY_CUISINE[c];
  }
  return MENU_BY_CUISINE['default'];
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

const seedMenuItems = async () => {
  try {
    await connectDB();

    // Fetch all restaurants (only _id and cuisine needed)
    const restaurants = await Restaurant.find({}, '_id cuisine').lean();
    if (restaurants.length === 0) {
      console.error('❌ No restaurants found. Run restaurant.seed.js first.');
      process.exit(1);
    }

    console.log(`✅ Found ${restaurants.length} restaurants.`);
    console.log(`📋 Generating ${restaurants.length * ITEMS_PER_RESTAURANT} menu items...\n`);

    const allItems = [];

    for (const restaurant of restaurants) {
      const pool = getItemPool(restaurant.cuisine);

      for (let i = 0; i < ITEMS_PER_RESTAURANT; i++) {
        const { availability, stock } = getStockAndAvailability(i);

        // Pick a name — cycle through pool, append index suffix when pool exhausted
        const baseName = pool[i % pool.length];
        const name = i < pool.length ? baseName : `${baseName} Special`;

        allItems.push({
          restaurantId: restaurant._id,
          name,
          price:        randFloat(49, 999),
          stock,
          availability,
        });
      }
    }

    // Insert in batches
    let inserted = 0;
    for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
      const batch = allItems.slice(i, i + BATCH_SIZE);
      await MenuItem.insertMany(batch, { ordered: false });
      inserted += batch.length;
      process.stdout.write(`\r  Inserted ${inserted}/${allItems.length} menu items...`);
    }

    console.log('\n');

    // ── Final breakdown for your reference ───────────────────────────────────
    const total        = allItems.length;
    const scenarioA    = allItems.filter(x =>  x.availability && x.stock > 10).length;
    const scenarioB    = allItems.filter(x =>  x.availability && x.stock >= 1 && x.stock <= 10).length;
    const scenarioC    = allItems.filter(x =>  x.availability && x.stock === 0).length;
    const scenarioD    = allItems.filter(x => !x.availability && x.stock > 0).length;
    const scenarioE    = allItems.filter(x => !x.availability && x.stock === 0).length;

    console.log('════════════════════════════════════════════════');
    console.log('           MENU ITEM SEED SUMMARY              ');
    console.log('════════════════════════════════════════════════');
    console.log(`  Total inserted          : ${total.toLocaleString()}`);
    console.log('------------------------------------------------');
    console.log(`  ✅ Available + good stock (>10)  : ${scenarioA.toLocaleString()}`);
    console.log(`  ⚠️  Available + low stock (1–10)  : ${scenarioB.toLocaleString()}`);
    console.log(`  🔴 Available + zero stock        : ${scenarioC.toLocaleString()}`);
    console.log(`  🚫 Unavailable + has stock       : ${scenarioD.toLocaleString()}`);
    console.log(`  ❌ Unavailable + no stock        : ${scenarioE.toLocaleString()}`);
    console.log('════════════════════════════════════════════════\n');

    console.log('✅ Done — menu items seeded successfully.');
    process.exit();
  } catch (error) {
    console.error('❌ MenuItem seeder failed:', error);
    process.exit(1);
  }
};

seedMenuItems();