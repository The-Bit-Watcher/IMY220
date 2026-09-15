const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const { connectRedis } = require("./redisClient");

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

async function startServer() {
    try {
        await connectRedis();

        await mongoose.connect(process.env.DB_URL);

        app.listen(5000, () => {
            console.log(
                "Server running on port 5000"
            );
        });

    } catch (err) {
        console.error("Server startup failed:", err);
        process.exit(1);
    }
}

startServer();