const orderQueue = require("../queues/order.queue");
const Order = require("../models/order.model");
const Payment = require("../models/payment.model");

orderQueue.process("cancel-order", async (job) => {
  const { orderId } = job.data;

  console.log("Checking order:", orderId);

  const order = await Order.findById(orderId);

  if (!order) {
    console.log("Order not found");
    return;
  }

  // If already processed → skip
  if (order.status !== "placed") {
    console.log("Order already processed:", order.status);
    return;
  }

  const payment = await Payment.findOne({ orderId });

  if (!payment) {
    console.log("Payment not found");
    return;
  }

  if (payment.status === "pending" && payment.method === "online") {
    order.status = "cancelled";
    await order.save();

    console.log("Order cancelled:", orderId);
  } else {
    console.log("Payment completed, no cancellation");
  }
});