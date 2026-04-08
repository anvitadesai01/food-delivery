require("dotenv").config();
const connectDB = require("../config/db");
connectDB();
require("./payment.worker");
require("./order.worker")

console.log("order worker started...");

console.log(" Payment worker started...");