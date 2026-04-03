const paymentQueue = require("../queues/payment.queue");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const MenuItem = require("../models/menuItem.model"); // ✅ NEW

paymentQueue.process(async (job) => {
  const { orderId } = job.data;

  console.log("Processing:", orderId);

  const payment = await Payment.findOne({ orderId });

  if (!payment) throw new Error("Payment not found");

  //  Prevent duplicate processing
  if (payment.status === "success") {
    console.log("Already processed:", orderId);
    return;
  }

  const isSuccess = Math.random() > 0.3;

  //  SUCCESS CASE
  if (isSuccess) {
    payment.status = "success";
    await payment.save();

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "success",
    });

    console.log("SUCCESS:", orderId);
    return;
  }

  //  FAIL CASE
  payment.status = "failed";
  await payment.save();

  //  GET ORDER
  const order = await Order.findById(orderId);

  //  RESTORE STOCK (VERY IMPORTANT)
  if (order && order.items?.length > 0) {
    for (const item of order.items) {
      await MenuItem.findByIdAndUpdate(item.menuItemId, {
        $inc: { stock: item.quantity },
      });
    }
  }

  //  UPDATE ORDER STATUS
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: "failed",
  });

  console.log("FAILED:", orderId);

  //  Retry trigger
  throw new Error("Payment failed");
});

/** EVENTS */
paymentQueue.on("completed", (job) => {
  console.log("Completed:", job.data.orderId);
});

paymentQueue.on("failed", (job, err) => {
  console.log("Failed:", job.data.orderId, err.message);
});