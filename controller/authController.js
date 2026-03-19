const otpGenerator=require('../utils/otpGenerator');
const response=require('../utils/responseHandler');
const User=require('../models/user.model');
const { sendOtptoEmail } = require('../services/emailService');
const { sendotptophone } = require('../services/twilioService');
const generateToken = require('../services/generateToken');

const sendOtp=async(req,res,next)=>{
        const {phoneNumber,phoneSuffix,email}=req.body;
        const otp=otpGenerator();
        const expiry=new Date(Date.now()+5*60*1000);
       try{
         let user;
        if(email){
            user=await(User.findOne({email}));
            if(!user)user=new User({email});
            user.emailOtp=otp;
            user.emailOtpExpiry=expiry;
            await user.save();
            await sendOtptoEmail(email,otp);
            return response(res,200,`otp sent to your email ${email}`);
        }
        if(!phoneNumber||!phoneSuffix){
            return response(res,400,'phone number is not valid')
        }
     const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
        user =await User.findOne({phoneNumber});
        if(!user)user= new User({phoneNumber,phoneSuffix});
await sendotptophone(fullPhoneNumber, otp)
        await user.save();
        return response(res,200,'otp sent')
       }
    catch(e){
             return response(res,400,'in Catch block',e)
    }
}

const verifyotp=async(req,res)=>{
    const {phoneNumber,phoneSuffix,email,otp}=req.body;
    let user;
    try{
        const now=new Date();
      if(email){
    user = await User.findOne({ email });
         if(!user)return response(res,404,'user not found');
         if(!user.emailOtp||String(user.emailOtp)!==String(otp)||now>new Date(user.emailOtpExpiry)){
            return response(res,404,'Invalid or Expired Otp');
         }
         user.isVerified=true;
         user.emailOtp=null;
         user.emailOtpExpiry=null;
         await user.save();
         const token=generateToken(user?.id);
         res.cookie("auth_token",token,{
            httpOnly:true,
            maxAge:1000*60*60*24*365
         });
         return response(res,200,'Otp verified Successfull',{token,user});
      }
    }
    catch(e){
             return response(res,400,'in Catch block',e)
    }
}
module.exports={
    sendOtp,
    verifyotp
}