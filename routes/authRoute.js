const express=require('express');
const {sendOtp,verifyotp}=require('../controller/authController');

const router=express.Router();

router.post('/send-otp',sendOtp);
router.post('/verify-otp',verifyotp);

module.exports=router;