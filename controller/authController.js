const otpGenerator=require('../utils/otpGenerator');
const response=require('../utils/responseHandler');
const User=require('../models/user.model');

const sendOtp=async(req,res,next)=>{
        const {phonenNumber,phoneSuffix,email}=req.body;
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
            return response(res,200,`otp sent to your email ${email}`);
        }
        if(!phonenNumber||!phoneSuffix){
            return response(res,400,'phone number is not valid')
        }
        const fullPhoneNumber=`${phonenNumber}${phoneSuffix}`;
        user =await user.findOne({phonenNumber});
        if(!user)user= new User({phoneNumber,phoneSuffix});
        await user.save();
        return response(res,200,'otp sent')
       }
    catch(e){
             return response(res,400,'in Catch block',e)
    }
}