const express=require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinaryConfig');
const { sendMessage, getConversation, getMessage, markAsRead, deleteMessage } = require('../controller/chatController');

const router=express.Router();

router.post('/send-message',authMiddleware,multerMiddleware,sendMessage);
router.get('/conversations',authMiddleware,getConversation)
router.get('/conversations/:conversationId/messages',authMiddleware,getMessage)
router.put('/message/read',authMiddleware,markAsRead)
router.delete('/message/:messageId',authMiddleware,deleteMessage)
module.exports=router