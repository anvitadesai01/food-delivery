const Queue = require("bull");
const redis = require("../config/redis");

const orderQueue = new Queue("order-queue", redis);

module.exports = orderQueue;