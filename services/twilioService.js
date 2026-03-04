const twilio =require('twilio')


const  accountSid=process.env.TWILIO_ACCOUNT_SID;
const authToken=process.env.TWILIO_AUTH_TOKEN
const servicesid=process.env.TWILIO_SERVICE_SID;

const client=twilio(accountSid,authToken);