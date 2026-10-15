
const axios = require("axios");

const BASE_URL = "https://control.msg91.com/api/v5/otp";

const headers = {
  authkey: process.env.MSG91_AUTH_KEY,
  "Content-Type": "application/json",
};

const normalizePhone = (phoneNumber) => {
  // Example: +919876543210 -> 919876543210
  return String(phoneNumber).replace(/\D/g, "");
};

const sendotptophone = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    if (
      !process.env.MSG91_AUTH_KEY ||
      !process.env.MSG91_TEMPLATE_ID
    ) {
      throw new Error("MSG91 environment variables are missing");
    }

    const mobile = normalizePhone(phoneNumber);

    const response = await axios.post(
      BASE_URL,
      {},
      {
        headers,
        params: {
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile,
        },
      }
    );
  console.log("MSG91 HTTP status:", response.status);
console.log("MSG91 response:", response.data);
console.log("MSG91 mobile:", mobile);

    return response.data;
  } catch (error) {
    console.error(
      "MSG91 send OTP error:",
      error.response?.data || error.message
    );

    throw new Error("Failed to send OTP");
  }
};

const verifyOtp = async (phoneNumber, otp) => {
  try {
    if (!phoneNumber || !otp) {
      throw new Error("Phone number and OTP are required");
    }

    const mobile = normalizePhone(phoneNumber);

    const response = await axios.get(`${BASE_URL}/verify`, {
      headers,
      params: {
        mobile,
        otp: String(otp),
      },
    });

    // MSG91 commonly returns type: "success" for valid OTPs.
    return (
      String(response.data?.type).toLowerCase() === "success"
    );
  } catch (error) {
    console.error(
      "MSG91 verify OTP error:",
      error.response?.data || error.message
    );

    return false;
  }
};

module.exports = {
  sendotptophone,
  verifyOtp,
};
