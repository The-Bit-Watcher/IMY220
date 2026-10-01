const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../.env") // backend/.env, no matter which folder you start node from
});

const authRoutes = require("./routes/authRoutes");
const albumRoutes = require("./routes/albumRoutes");
const postRoutes = require("./routes/postRoutes");
const profileRoutes = require("./routes/profileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { connectRedis } = require("./config/redis");

const app = express();

// Raised from the 100kb default: profile pictures / post images are sent as base64
app.use(express.json({ limit: "10mb" }));

app.use(authRoutes);
app.use(profileRoutes);
app.use(postRoutes);
app.use(albumRoutes);
app.use(adminRoutes);

// Log route errors instead of failing silently
app.use((err, req, res, next) => {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    res.status(500).json({ success: false, message: err.message });
});

async function startServer() {
    if (!process.env.DB_URL) {
        console.error("DB_URL missing - check backend/.env");
        process.exit(1);
    }
    try {
        await connectRedis();

        await mongoose.connect(process.env.DB_URL);
        console.log("Connected to MongoDB:", mongoose.connection.name);

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