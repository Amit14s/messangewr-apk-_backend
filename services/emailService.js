const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
const nodemailer=require('nodemailer');
const dotenv=require('dotenv');
dotenv.config();


const sendOtptoEmail = async (email, otp) => {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Messanger Email Verification</h2>
        <p>Your OTP for email verification is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This code is valid for 5 minutes.</p>
        <p>Do not share this code with anyone.</p>
      </div>
    `;

    const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": process.env.BREVO_API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: "Messangewr",
                    email: process.env.BREVO_SENDER_EMAIL
                },
                to: [{ email }],
                subject: "Your Messangewr Verification Code",
                htmlContent: html
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error("Brevo email error:", data);
        throw new Error("Failed to send OTP email");
    }

    return data;
};

module.exports = { sendOtptoEmail };


module.exports={
    sendOtptoEmail,
}