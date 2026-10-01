const redis = require("redis");

const redisClient = redis.createClient({
    url: "redis://localhost:6379"
});

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

async function connectRedis() {
    await redisClient.connect();
    console.log("Connected to Redis");
}

module.exports = {
    redisClient,
    connectRedis
};