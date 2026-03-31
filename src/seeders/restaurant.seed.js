require('dotenv').config();
const connectDB = require('../config/db');
const Restaurant = require('../models/restaurant.model');

// ─── Data Pools ───────────────────────────────────────────────────────────────

const PREFIXES = [
  "Royal","Golden","Spice","Tandoor","Masala","Saffron","Curry","Pepper","Zaika","Swad",
  "Rasoi","Dawat","Haveli","Bahar","Shaan","Mast","Ustad","Dum","Lazeez","Nazrana",
  "Mehfil","Dastarkhan","Zaiqa","Bawarchi","Khansama","Handi","Awadhi","Mughal","Punjabi","Desi",
  "Chhappan","Bikaneri","Rajwada","Sheesh Mahal","Chokhi Dhani","Laxmi","Annapurna","Saraswati","Tulsi","Neem",
  "Peepal","Banyan","Mango","Tamarind","Coconut","Ginger","Garlic","Chilli","Basil","Thyme",
  "Saffron","Cardamom","Cinnamon","Clove","Nutmeg","Cumin","Coriander","Turmeric","Fenugreek","Mustard",
  "Urban","The","Bombay","Delhi","Madras","Calcutta","Lucknowi","Hyderabadi","Kashmiri","Goan",
  "Bengal","Maratha","Chettinad","Malabar","Konkan","Deccan","Vindhya","Himalayan","Coastal","Riverine",
  "Heritage","Classic","Modern","Vintage","Rustic","Chic","Trendy","Cozy","Vibrant","Lively",
  "Organic","Natural","Fresh","Pure","Original","Authentic","Traditional","Signature","Premium","Elite",
];

const SUFFIXES = [
  "Palace","Garden","Kitchen","House","Corner","Point","Hub","Junction","Bistro","Lounge",
  "Eatery","Express","Delight","Paradise","Terrace","Zone","Bites","Spot","Den","Shack",
  "Dhaba","Tadka","Bhoj","Rasoi","Chowk","Chowkdi","Adda","Thali","Bhandara","Langar",
  "Darbar","Mahal","Haveli","Kothi","Bungalow","Villa","Retreat","Getaway","Escape","Oasis",
  "Trail","Path","Route","Avenue","Square","Circle","Arcade","Gallery","Pavilion","Courtyard",
  "Café","Diner","Restaurant","Bar & Grill","Brewpub","Taproom","Cantina","Trattoria","Brasserie","Tavern",
  "Station","Depot","Junction","Terminal","Crossroads","Landmark","Milestone","Waypoint","Stopover","Base",
  "Nook","Alcove","Niche","Corner","Pocket","Hideaway","Retreat","Sanctuary","Haven","Refuge",
  "Flame","Fire","Ember","Blaze","Spark","Glow","Flicker","Shimmer","Shine","Radiance",
  "Feast","Fête","Gala","Soirée","Banquet","Buffet","Spread","Table","Board","Platter",
];

const LOCATIONS = [
  "Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Surat",
  "Lucknow","Kanpur","Nagpur","Indore","Bhopal","Visakhapatnam","Patna","Vadodara","Ghaziabad","Ludhiana",
  "Coimbatore","Agra","Madurai","Nashik","Rajkot","Meerut","Faridabad","Varanasi","Srinagar","Aurangabad",
  "Dhanbad","Amritsar","Ranchi","Allahabad","Jodhpur","Raipur","Kochi","Chandigarh","Guwahati","Solapur",
  "Hubli","Tiruchirappalli","Bareilly","Mysore","Aligarh","Jalandhar","Bhubaneswar","Salem","Warangal","Guntur",
  "Bhilai","Kota","Bikaner","Cuttack","Firozabad","Bhavnagar","Dehradun","Durgapur","Asansol","Nanded",
  "Kolhapur","Ajmer","Gulbarga","Jamshedpur","Ujjain","Loni","Siliguri","Jhansi","Ulhasnagar","Nellore",
  "Jammu","Sangli","Belgaum","Mangalore","Ambattur","Tirunelveli","Malegaon","Gaya","Jalgaon","Udaipur",
  "Maheshtala","Davanagere","Kozhikode","Akola","Kurnool","Rajpur Sonarpur","Bokaro","South Dumdum","Bellary","Patiala",
  "Gopalpur","Agartala","Bhagalpur","Muzaffarnagar","Bhatpara","Panihati","Latur","Dhule","Rohtak","Korba",
];

const CUISINES = [
  "North Indian","South Indian","Chinese","Italian","Mexican","Continental",
  "Fast Food","Street Food","Mughlai","Biryani","Thai","Japanese",
  "Mediterranean","Seafood","Tandoori","Gujarati","Rajasthani","Bengali",
  "Punjabi","Kerala","Chettinad","Andhra","Hyderabadi","Maharashtrian",
  "Goan","Lebanese","Turkish","Korean","Vietnamese","American",
];

// ─── Config ───────────────────────────────────────────────────────────────────

const TOTAL_RESTAURANTS = 1000;
const BATCH_SIZE = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand      = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(1));
const randInt   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function pickCuisines() {
  const count = randInt(1, 3);
  const result = [];
  while (result.length < count) {
    const c = rand(CUISINES);
    if (!result.includes(c)) result.push(c);
  }
  return result;
}

function generateName(index) {
  // Mix strategies so names stay varied across 1000 restaurants
  const strategy = index % 4;
  switch (strategy) {
    case 0: return `${rand(PREFIXES)} ${rand(SUFFIXES)}`;
    case 1: return `${rand(PREFIXES)} ${rand(PREFIXES)} ${rand(SUFFIXES)}`;
    case 2: return `The ${rand(PREFIXES)} ${rand(SUFFIXES)}`;
    case 3: return `${rand(PREFIXES)} & ${rand(PREFIXES)} ${rand(SUFFIXES)}`;
  }
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

const seedRestaurants = async () => {
  try {
    await connectDB();

    const restaurants = Array.from({ length: TOTAL_RESTAURANTS }, (_, i) => ({
      name:     generateName(i),
      location: rand(LOCATIONS),
      cuisine:  pickCuisines(),
      rating:   randFloat(2.5, 5.0),
    }));

    let inserted = 0;
    for (let i = 0; i < restaurants.length; i += BATCH_SIZE) {
      const batch = restaurants.slice(i, i + BATCH_SIZE);
      await Restaurant.insertMany(batch, { ordered: false });   // no pre-save hook needed here
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${TOTAL_RESTAURANTS} restaurants...`);
    }

    console.log(`\n✅ Done — ${inserted} restaurants seeded successfully.`);
    process.exit();
  } catch (error) {
    console.error('❌ Restaurant seeder failed:', error);
    process.exit(1);
  }
};

seedRestaurants();