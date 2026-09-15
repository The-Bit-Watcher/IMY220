const redis = require('redis');
const jwt = require("jsonwebtoken");

async function checkTokenValidity(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send("Authorization token required");
    }

    const token = authHeader.split(" ")[1];

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const isRevoked = await redisClient(decoded.jti);
        if (isRevoked){
            return res.status(400).send('Token has been invalidated');
        }
        req.user = decoded;
        next();
    }catch(err){
        res.status(403).send('Invalid token.');
    }
}

module.exports(
    checkTokenValidity
);