const otpGenerator=require('../utils/otpGenerator');
const response=require('../utils/responseHandler');
const User=require('../models/user.model');
const { sendOtptoEmail } = require('../services/emailService');
const { sendotptophone } = require('../services/twilioService');
const generateToken = require('../services/generateToken');
const { uploadToCloudinary } = require('../config/cloudinaryConfig');
const { Conversation } = require('twilio/lib/twiml/VoiceResponse');
const user = require('../models/user.model');

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
const updateProfile=async(req,res)=>{
    const {username,agreed,about}=req.body;
    const userId=req.user.userId;
    try{
           const user=await User.findById(userId);
           const file=req.file;
           if(file){
            const uploadResult=await uploadToCloudinary(file);
            user.profilePicture=uploadResult?.secure_url;
           }
           else if(req.body.profilePicture){
            user.profilePicture=req.body.profilePicture
           }
           if(username)user.username=username;
           if(agreed)user.agreed=agreed;
           if(about)user.about=about;
           await user.save();
           return response(res,200,'user profile updated sucessfully',user)
    }
        catch(e){
             return response(res,400,'in Catch block',e)
    }

}
const checkAuthenticated=async(req,res)=>{
    try{
          const userId=req.user.userId;
          if(!userId)return response(res,404,'unauthorization! please login');
          const user= await User.findById(userId);
          if(!user)return response(res,404,'user not found');
          return response(res,200,'user is allowed to use messanger app',user);
    }
           catch(e){
             return response(res,400,'in Catch block',e)
    }
}
const logout=async(req,res)=>{
    try{
          res.cookie('auth_token',"",{expires:new Date(0)});
          return response(res,200,'user logout sucessfully');
    }
         catch(e){
             return response(res,400,'in Catch block',e)
    }
}
const getAllUser=async(req,res)=>{
    const loggedInuser=req.user.userId;
    try{
        const users= await User.find({_id:{$ne:loggedInuser}}).select("username profilePicture lastSeen isOnline about phoneNumber phoneSuffix").lean();
        const userWithConverstion=await Promise.all(
           users.map(async (user)=>{
            const conversation= await Conversation.findOne({
                participants:{$all:[loggedInuser,user?._id]}
            }).populate({
                path:"lastMessage",
                select:'content createdAt sender receiver'
            }).lean();

            return {
            ...user,
            conversation:conversation |null
           }
           })
        )
           return response(res,200,'user rerived succesfully',userWithConverstion)
  
    }
         catch(e){
             return response(res,400,'in Catch block',e)
    }
}
module.exports={
    sendOtp,
    verifyotp,
    updateProfile,
    logout,
    checkAuthenticated,
    getAllUser,
}