const express=require('express');
const {sendOtp,verifyotp, updateProfile, checkAuthenticated, getAllUser,searchUser,logout}=require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinaryConfig');

const router=express.Router();

router.post('/send-otp',sendOtp);
router.post('/verify-otp',verifyotp);
router.put('/update-profile',authMiddleware,multerMiddleware,updateProfile)
router.get('/check-auth',authMiddleware,checkAuthenticated)
router.get('/users',authMiddleware,getAllUser)
router.get("/search-user", authMiddleware, searchUser);
router.get('/logout',logout);

module.exports=router;