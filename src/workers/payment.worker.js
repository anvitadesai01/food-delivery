const paymentQueue = require("../queues/payment.queue");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");

paymentQueue.process(async (job) => {
  const { orderId } = job.data;

  console.log(" Processing:", orderId);

  const payment = await Payment.findOne({ orderId });

  if (!payment) throw new Error("Payment not found");

  const isSuccess = Math.random() > 0.3;

  if (isSuccess) {
    payment.status = "success";
    await payment.save();

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "success",
    });

    console.log(" SUCCESS:", orderId);
    return;
  }

  // FAIL CASE
  payment.status = "failed";
  await payment.save();

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: "failed",
  });

  console.log(" FAILED:", orderId);

  throw new Error("Payment failed"); // triggers retry
});

/** EVENTS */
paymentQueue.on("completed", (job) => {
  console.log(" Completed:", job.data.orderId);
});

paymentQueue.on("failed", (job, err) => {
  console.log(" Failed:", job.data.orderId, err.message);
});