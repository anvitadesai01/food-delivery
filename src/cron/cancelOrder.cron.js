const cron = require("node-cron");
const orderQueue = require("../queues/order.queue"); 

// Run every minute
cron.schedule("* * * * *", async () => {
  console.log("Cron: Checking unpaid orders...");

  await orderQueue.add("cancel-unpaid-orders");
});