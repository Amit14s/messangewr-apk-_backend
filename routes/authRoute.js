const express=require('express');
const {sendOtp,verifyotp, updateProfile, checkAuthenticated, getAllUser,searchUser}=require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinaryConfig');

const router=express.Router();

router.post('/send-otp',sendOtp);
router.post('/verify-otp',verifyotp);
router.put('/update-profile',authMiddleware,multerMiddleware,updateProfile)
router.get('/check-auth',authMiddleware,checkAuthenticated)
router.get('/users',authMiddleware,getAllUser)
router.get("/search-user", authMiddleware, searchUser);
module.exports=router;