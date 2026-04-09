const orderQueue = require("../queues/order.queue");
const Order = require("../models/order.model");

orderQueue.process("cancel-unpaid-orders", async () => {
  console.log("Worker: Checking unpaid ONLINE orders...");

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const orders = await Order.aggregate([
    {
      $match: {
        status: "placed",
        createdAt: { $lte: fifteenMinutesAgo },
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "orderId",
        as: "payment",
      },
    },
    { $unwind: "$payment" },
    {
      $match: {
        "payment.status": "pending",
        "payment.method": "online",
      },
    },
  ]);

  const orderIds = orders.map(o => o._id);

  if (orderIds.length > 0) {
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { status: "cancelled" } }
    );

    console.log(`Cancelled ${result.modifiedCount} orders`);
  }
});