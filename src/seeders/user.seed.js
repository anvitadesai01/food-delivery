require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/user.model');

const FIRST_NAMES = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Ayaan","Krishna","Ishaan","Shaurya","Atharv","Advik","Dhruv","Advait","Kabir","Ritvik","Aarush","Shaan","Dev","Ananya","Aadhya","Anvi","Pari","Aanya","Riya","Aaradhya","Myra","Kiara","Tara","Saanvi","Navya","Priya","Pooja","Sneha","Meera","Kavya","Divya","Nisha","Simran","Rohan","Kunal","Rahul","Nikhil","Amit","Vijay","Suresh","Ramesh","Mahesh","Ganesh"];
const LAST_NAMES  = ["Patel","Shah","Mehta","Desai","Joshi","Sharma","Gupta","Singh","Kumar","Verma","Agarwal","Chaudhary","Yadav","Mishra","Pandey","Tiwari","Dubey","Srivastava","Chauhan","Thakur","Iyer","Nair","Menon","Pillai","Reddy","Rao","Naidu","Murthy","Chakraborty","Banerjee","Das","Ghosh","Bose","Sen","Mukherjee","Roy","Dutta","Saha","Paul","Mondal"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const TOTAL_USERS = 500;
const BATCH_SIZE  = 100;

const seedUsers = async () => {
  try {
    await connectDB();

    // Build all user docs
    const users = Array.from({ length: TOTAL_USERS }, (_, i) => ({
      name:     `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`,
      email:    `user${i + 1}@foodapp.com`,
      password: 'Password@123',   // hashed by the pre-save hook in user.model.js
      role:     'user',
    }));

    // Insert in batches to trigger pre-save hook on every doc
    let inserted = 0;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await User.create(batch);          // create() fires pre-save hook → bcrypt runs
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${TOTAL_USERS} users...`);
    }

    console.log(`\n✅ Done — ${inserted} users seeded successfully.`);
    process.exit();
  } catch (error) {
    console.error('❌ User seeder failed:', error);
    process.exit(1);
  }
};

seedUsers();