const { createJWT } = require("../controllers/authController");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { redisClient } = require("../config/redis");



app.post("/login", async(req, res, next) => {
  let {email, password} = req.body;

  let existingUser;
  try{
    //search in mongodb by email
    existingUser = await User.findOne({email: email});
  }catch{
    const error = new Error('Error! Something went wrong.');
    return next(error);
  }

  if (!existingUser)
  {
    const error = new Error('Incorrect details');
    return next(error);
  }

  let passwordMatches = await bcrypt.compare(password, existingUser.hashedPassword);

  if (!passwordMatches){
    return res.status(401).json({
        message: "Invalid credentials"
    });
  }

  const token = createJWT({userId: existingUser._id, email: existingUser.email});

  res.status(200)
    .json({
      success: true,
      data: {
          userId: existingUser.id,
          email: existingUser.email,
          token: token,
      },
    });
});

// Sign-up endpoint returning dummy data
app.post('/signup', async(req, res, next) => {
  const {username, email, password} = req.body;
  let existingUser;
  try {
    //await add user to db
    let hashedPassword = await bcrypt.hash(password, process.env.SALT_ROUNDS);
    existingUser = await User.create({username: username, email: email, hashedPassword: hashedPassword });
  }catch{
    const error = new Error('Error! Something went wrong.');
    next(error);
  }

  if (!existingUser){
    return res.status(500).json({
        message: 'Something went wrong.'
    });
  }

  let token = createJWT({userId: existingUser._id, email: existingUser.email});
  res.status(200)
    .json({
      success: true,
      data: {
          userId: existingUser.id,
          email: existingUser.email,
          token: token,
      },
    });
});


app.post("/logout", async (req, res) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send(
            "Authorization token required"
        );
    }

    try {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const timeRemaining =
            decoded.exp - Math.floor(Date.now() / 1000);

        if (timeRemaining > 0) {
            await redisClient.set(
                `revoked:${decoded.jti}`,
                "revoked",
                {
                    EX: timeRemaining
                }
            );
        }

        res.status(200).send(
            "Logged out successfully"
        );

    } catch (err) {
        res.status(401).send("Invalid token");
    }
});


