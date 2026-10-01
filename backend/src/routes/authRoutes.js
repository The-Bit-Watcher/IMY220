const express = require("express");
const router = express.Router();

const { createJWT } = require("../controllers/authController");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { redisClient } = require("../config/redis");

const checkTokenValidity = require("../Middleware/jwtVerifyMiddleware");

// LOGIN ENDPOINT
router.post("/api/login", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      existingUser.hashedPassword
    );

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createJWT({
      userId: existingUser._id,
      email: existingUser.email,
    });

    return res.status(200).json({
      success: true,
      data: {
        userId: existingUser._id,
        email: existingUser.email,
        username: existingUser.username,
        token: token,
      },
    });
  } catch (error) {
    console.error("Login Route Error:", error);
    return res.status(500).json({ message: "Error! Something went wrong." });
  }
});

// SIGNUP ENDPOINT
router.post("/api/signup", async (req, res) => {
  // 1. Destructure 'name' along with username, email, and password
  const { username, name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email address already registered." });
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2. Pass 'name' into User.create()
    const newUser = await User.create({
      username,
      name: name || username, // Fallback to username if name isn't provided
      email,
      hashedPassword,
    });

    const token = createJWT({
      userId: newUser._id,
      email: newUser.email,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        userId: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        token: token,
      },
    });
  } catch (error) {
    console.error("Signup Route Error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Server error during signup" });
  }
});


// LOGOUT ENDPOINT
router.post("/api/logout", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Authorization token required");
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const timeRemaining = decoded.exp - Math.floor(Date.now() / 1000);

    if (timeRemaining > 0) {
      await redisClient.set(`revoked:${decoded.jti}`, "revoked", {
        EX: timeRemaining,
      });
    }

    return res.status(200).send("Logged out successfully");
  } catch (err) {
    return res.status(401).send("Invalid token");
  }
});

module.exports = router;