const jwt = require('jsonwebtoken');
const crypto = require("crypto");

function createJWT({userId,email}) {
  let token;
  try{
  token = jwt.sign(
              {
                  userId: userId,
                  email: email
              },
              process.env.JWT_SECRET,
              { 
                expiresIn: "1h",
                jwtid: crypto.randomUUID()
              }
          );
  }catch (err){
    console.log(err);
    const error =
        new Error("Error! Something went wrong.");
  }
  return token;
}

module.exports= {
    createJWT
};