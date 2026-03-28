const express=require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinaryConfig');
const router=express.Router();
const {createStatus, getStatus, viewStatus, deleteStatus}=require('../controller/statusController')

router.post('/',authMiddleware,multerMiddleware,createStatus);
router.get('/conversations',authMiddleware,getStatus)

router.put('/:statusId/view',authMiddleware,viewStatus)
router.delete('/:statusId',authMiddleware,deleteStatus)
module.exports=router