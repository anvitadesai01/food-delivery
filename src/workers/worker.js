require("dotenv").config();
const connectDB = require("../config/db");
connectDB();
require("./payment.worker");


console.log(" Payment worker started...");