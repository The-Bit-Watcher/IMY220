const jwt = require("jsonwebtoken");
const { redisClient } = require("../config/redis");
const User = require("../models/User");

const unauthorized = (res, message) => res.status(401).json({ success: false, message });

// Requires a valid, non-revoked JWT for a user that still exists.
// The role is read from the database (not trusted from the token), so promoting,
// demoting or deleting an account takes effect immediately.
// 401 = not logged in / session invalid (frontend logs out). 403 = logged in but not allowed.
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return unauthorized(res, "Please log in to continue.");
    }

    let decoded;
    try {
        decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    } catch {
        return unauthorized(res, "Your session has expired. Please log in again.");
    }

    if (decoded.jti && await redisClient.get(`revoked:${decoded.jti}`)) {
        return unauthorized(res, "You have been logged out. Please log in again.");
    }

    const user = await User.findById(decoded.userId).select("role").lean();
    if (!user) {
        return unauthorized(res, "This account no longer exists.");
    }

    req.user = {
        userId: user._id.toString(),
        role: user.role,
        isAdmin: user.role === "admin",
        jti: decoded.jti,
        exp: decoded.exp
    };
    next();
}

// Use after requireAuth
function requireAdmin(req, res, next) {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ success: false, message: "Admin privileges required." });
    }
    next();
}

module.exports = { requireAuth, requireAdmin };
