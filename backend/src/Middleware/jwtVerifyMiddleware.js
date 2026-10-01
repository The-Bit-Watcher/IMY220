const { redisClient } = require("../config/redis");
const jwt = require("jsonwebtoken");
require('dotenv').config();

async function checkTokenValidity(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send("Authorization token required");
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Safely verify if token is revoked using redisClient.get
        if (decoded.jti) {
            const isRevoked = await redisClient.get(`revoked:${decoded.jti}`);
            if (isRevoked) {
                return res.status(401).send('Token has been invalidated');
            }
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(403).send('Invalid token.');
    }
}

module.exports = checkTokenValidity;