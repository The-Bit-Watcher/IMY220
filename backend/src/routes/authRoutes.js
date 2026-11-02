const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const { createJWT } = require("../controllers/authController");
const User = require("../models/User");
const { redisClient } = require("../config/redis");

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

// What the frontend keeps about the logged-in user
const sessionPayload = (user, token) => ({
    userId: user._id,
    email: user.email,
    username: user.username,
    name: user.name,
    profileImage: user.profileImage,
    role: user.role,
    token
});

router.post("/api/login", async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Please enter your email and password." });
    }

    const user = await User.findOne({ email }).select("+password");
    // Plain-text comparison: the spec requires unhashed passwords
    if (!user || user.password !== password) {
        return res.status(401).json({ success: false, message: "Incorrect email or password." });
    }

    const token = createJWT({ userId: user._id, email: user.email, role: user.role });
    return res.status(200).json({ success: true, data: sessionPayload(user, token) });
});

router.post("/api/signup", async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const name = String(req.body?.name || "").trim() || username;
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!USERNAME_RE.test(username)) {
        return res.status(400).json({ success: false, message: "Username must be 3-30 characters: letters, numbers, _ or ." });
    }
    if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    if (await User.exists({ email })) {
        return res.status(409).json({ success: false, message: "That email address is already registered." });
    }
    if (await User.exists({ username })) {
        return res.status(409).json({ success: false, message: "That username is already taken." });
    }

    // New accounts are always regular users; role cannot be set from the client
    const user = await User.create({ username, name, email, password });
    const token = createJWT({ userId: user._id, email: user.email, role: user.role });

    return res.status(201).json({
        success: true,
        message: "Account created.",
        data: sessionPayload(user, token)
    });
});

// Revokes the token in Redis so it can't be reused before it expires
router.post("/api/logout", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(200).json({ success: true, message: "Logged out." });
    }

    try {
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        const timeRemaining = decoded.exp - Math.floor(Date.now() / 1000);
        if (decoded.jti && timeRemaining > 0) {
            await redisClient.set(`revoked:${decoded.jti}`, "revoked", { EX: timeRemaining });
        }
    } catch {
        // Expired/invalid token: nothing to revoke, the client is logged out either way
    }
    return res.status(200).json({ success: true, message: "Logged out." });
});

module.exports = router;
