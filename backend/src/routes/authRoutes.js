import createJWT from '../controllers/authController'

const redis = require('redis');
const redisClient = redis.createClient();


//need to create db and add db logic + password encryption using bcrypt
// Sign-in endpoint returning dummy data
app.post("/login", async(req, res, next) => {
  let {email, password} = req.body;

  let existingUser;
  try{
    //search in mongodb
    
  }catch{
    const error = new Error('Error! Something went wrong.');
    return next(error);
  }

  if (!existingUser || existingUser.password !== password)
  {
    const error = new Error('Wrong details');
    return next(error);
  }

  const token = createJWT({existingUser.userId, existingUser.email});

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
  const {name, email, password} = req.body;
  try {
    //await add user to db 
  }catch{
    const error = new Error('Error! Something went wrong.');
    next(error);
  }

  let token = createJWT({userId, email});
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


