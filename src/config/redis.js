const { createClient } = require("redis");

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
  },
});

// MUST be before connect
redisClient.on("connect", () => {
  console.log("Redis Connected");
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

// proper async connect
const connectRedis = async () => {
  await redisClient.connect();
};

connectRedis();

module.exports = redisClient;