const nodemailer=require('nodemailer');
const dotenv=require('dotenv');
dotenv.config();
console.log("EMAIL configured:", !!process.env.EMAIL);
console.log("EMAIL_PASS configured:", !!process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000
});
transporter.verify((error, success) => {
  console.log("EMAIL configured:", !!process.env.EMAIL);
console.log("EMAIL_PASS configured:", !!process.env.EMAIL_PASS);
    if (error) {
        console.error("Gmail connection failed:", error.message);
        console.error("Error code:", error.code);
    } else {
        console.log("Gmail connection successful");
    }
});
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