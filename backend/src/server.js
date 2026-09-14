const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());


function createJWT({userId,email}) {
  let token;
  try{
  token = jwt.sign(
              {
                  userId: userId,
                  email: email
              },
              "secretkeyappearshere",
              { expiresIn: "1h" }
          );
  }catch (err){
    console.log(err);
    const error =
        new Error("Error! Something went wrong.");
    return next(error);
  }
  return token;
}
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

  let token = createJWT(existingUser.userId, existingUser.email);

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

  let token = createJWT(userId, email);
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

app.listen(5000, () => console.log('Server running on port 5000'));