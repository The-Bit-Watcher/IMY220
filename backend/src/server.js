require("./config/env");
const express = require("express");

const authRoutes = require("./routes/authRoutes");
const albumRoutes = require("./routes/albumRoutes");
const postRoutes = require("./routes/postRoutes");
const profileRoutes = require("./routes/profileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const searchRoutes = require("./routes/searchRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const { connectRedis } = require("./config/redis");
const { connectDB } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "10mb" }));

app.use(authRoutes);
app.use(profileRoutes);
app.use(postRoutes);
app.use(albumRoutes);
app.use(searchRoutes);
app.use(verificationRoutes);
app.use(adminRoutes);

// Unknown API route
app.use("/api", (req, res) => {
    res.status(404).json({ success: false, message: "Endpoint not found." });
});

// Central error handler (Express 5 forwards rejected promises from async routes here)
app.use((err, req, res, _next) => { // 4 args = Express error handler
    if (err.type === "entity.too.large") {
        return res.status(413).json({ success: false, message: "That upload is too large." });
    }
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ success: false, message: "Malformed JSON body." });
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "value";
        return res.status(409).json({ success: false, message: `That ${field} is already taken.` });
    }
    if (err.name === "ValidationError" || err.name === "CastError") {
        return res.status(400).json({ success: false, message: err.message });
    }
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
});

async function startServer() {
    try {
        await connectRedis();
        await connectDB();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error("Server startup failed:", err);
        process.exit(1);
    }
}

startServer();
