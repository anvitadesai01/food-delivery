const Queue = require("bull");

const orderQueue = new Queue("order-queue", {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,

  },
});

module.exports = orderQueue;