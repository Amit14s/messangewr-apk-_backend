const nodemailer=require('nodemailer');
const dotenv=require('dotenv');
dotenv.config();

const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.EMAIL,
        pass:process.env.EMAIL_PASS
    }
});
transporter.verify((error,success)=>{
    if(error){
        console.log('gmail connection failed');

    }
    else console.log('gmail connection successful')
})
const sendOtptoEmail=async(email,otp)=>{
    const html = `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
  
  <div style="max-width:500px; margin:auto; background:#ffffff; padding:30px; border-radius:10px; text-align:center; box-shadow:0 3px 10px rgba(0,0,0,0.1);">
    
    <h2 style="color:#333;">Email Verification</h2>

    <p style="color:#555; font-size:15px;">
      Use the OTP below to verify your email address.
    </p>

    <div style="
      font-size:32px;
      font-weight:bold;
      letter-spacing:6px;
      margin:25px 0;
      color:#4F46E5;
    ">
      ${otp}
    </div>

    <p style="color:#777; font-size:14px;">
      This code will expire in <b>10 minutes</b>.
    </p>

    <p style="color:#999; font-size:13px;">
      If you didn't request this code, you can safely ignore this email.
    </p>

  </div>

</div>
`;

await transporter.sendMail({
    from:`messanger Web < ${process.env.EMAIL}`,
    to:email,
    subject:'your messanger verification Code',
    html,
})
}

module.exports={
    sendOtptoEmail,
}