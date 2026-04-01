require("dotenv").config();

const connectDB = require("../config/db");
connectDB(); // 

const orderQueue = require("../queues/order.queue");
const Order = require("../models/order.model");

//  process job
orderQueue.process("orderPlaced", async (job) => {
  const { orderId } = job.data;

  console.log(" Processing order:", orderId);

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  console.log(" Order confirmed:", order._id);
});

// events
orderQueue.on("completed", (job) => {
  console.log(` Job ${job.id} completed`);
});

orderQueue.on("failed", (job, err) => {
  console.log(` Job ${job.id} failed:`, err.message);
});