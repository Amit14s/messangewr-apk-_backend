const twilio =require('twilio')


const  accountSid=process.env.TWILIO_ACCOUNT_SID;
const authToken=process.env.TWILIO_AUTH_TOKEN
const servicesid=process.env.TWILIO_SERVICE_SID;

const client=twilio(accountSid,authToken);

const sendotptophone=async(phoneNumber)=>{
  try{
      if(!phoneNumber){
        throw new Error('phone number is')
    }
    const response=await client.verify.v2.services(servicesid).verification.create({
        to:phoneNumber,
        channel:'sms'
    });
    return response;
}
catch(e){
    throw new Error('failed to Send OTp')
}
  }

  const verifyOtp=async(phoneNumber,otp)=>{
    try{
     const response =await client.verify.v2.services(servicesid).verificationChecks.create({
        to:phoneNumber,
        code:otp,
     })
     return response;
    }
    catch(e){
    throw new Error('failed to Send OTp')
}
  }

  module.exports={
    sendotptophone,
    verifyOtp
  }