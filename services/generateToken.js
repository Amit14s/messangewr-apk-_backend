const jwt=require('jsonwebtoken');

const generateToken=(userId)=>{
    return jwt.sign({userId},process.env.SECRET,{expiresIn:'1y'})
}
module.exports=generateToken;