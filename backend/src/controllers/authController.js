const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// jti lets a single token be revoked on logout
function createJWT({ userId, email, role = "user" }) {
    return jwt.sign(
        { userId, email, role },
        process.env.JWT_SECRET,
        { expiresIn: "1h", jwtid: crypto.randomUUID() }
    );
}

module.exports = { createJWT };
