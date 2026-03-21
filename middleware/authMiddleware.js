const jwt = require('jsonwebtoken');
const response=require('../utils/responseHandler');

const authMiddleware=(req,res,next)=>{
    const authToken=req.cookies?.auth_token;
    if(!authToken)return response(res,401,'authorization token missing please provide token');
    try{
          const decode=jwt.verify(authToken,process.env.SECRET)
          req.user=decode
          next();
    }
    catch(e){
        return response(res,401,'invalid or expired token',e);
    }

}
module.exports=authMiddleware