const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config({
    path: "../.env"
});

const authRoutes = require("./routes/authRoutes");
const albumRoutes = require("./routes/albumRoutes");
const postRoutes = require("./routes/postRoutes");
const profileRoutes = require("./routes/profileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { connectRedis } = require("./config/redis");

const app = express();

app.use(express.json());

app.use(authRoutes);
app.use(profileRoutes);
app.use(postRoutes);
app.use(albumRoutes);

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