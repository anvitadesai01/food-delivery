const orderQueue = require("../queues/order.queue");
const Order = require("../models/order.model");

orderQueue.process("cancel-unpaid-orders", async () => {
  console.log("Worker: Processing unpaid orders...");

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const result = await Order.updateMany(
    {
      status: "pending",
      paymentStatus: "pending",
      createdAt: { $lte: fifteenMinutesAgo },
    },
    {
      $set: { status: "cancelled" },
    }
  );

  console.log(`Cancelled ${result.modifiedCount} orders`);
});