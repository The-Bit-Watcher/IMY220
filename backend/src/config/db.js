// The ONLY place the app connects to MongoDB (used by server.js and the seed script).
const mongoose = require("mongoose");

async function connectDB() {
    if (!process.env.DB_URL) {
        throw new Error("DB_URL missing - check backend/.env");
    }
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to MongoDB:", mongoose.connection.name);
    return mongoose.connection;
}

async function disconnectDB() {
    await mongoose.connection.close();
}

module.exports = { connectDB, disconnectDB };
