const {uploadToCloudinary}=require('../config/cloudinaryConfig');
const status = require('../models/status');
const Status=require('../models/status');
const response=require('../utils/responseHandler');
const Message=require('../models/messages')





exports.createStatus= async(req,res)=>{
    try{
  const {content}=req.body;
  const file=req.file;
  const userId=req.user.userId;
  
  let mediaUrl=null;
  let finalcontentType=null;
  if(file){
    const uploadfile=await uploadToCloudinary(file);
    if(!uploadfile?.secure_url)return response(res,400,'failed to upload file')
   mediaUrl=uploadfile?.secure_url;
    if(file.mimetype.startWith('image'))finalcontentType="image"
    else if(file.mimetype.startWith('video'))finalcontentType="video"
    else return response(res,400,'unsupported file type')
  }
  else if(content?.trim())finalcontentType='text';
  else return response(res,400,'message content is required');

  const expiresAt=new Date();
  expiresAt.setHours(expiresAt.getHours()+24);
const status=new Status({
    user:userId,
    content:mediaUrl||content,
    contentType:finalcontentType,
     expiresAt:expiresAt
})
await status.save();

const populateMessage=await Status.findOne(status?._id).populate("user","username profilePicture").populate("viewers","username profilePicture")

if(req.io && req.socketUserMap){
    // brodacast to all connecting user except the cretor
    for(const [connectedUserId,socketId] of req.socketUserMap){
        if(connectedUserId!==userId){
            req.io.to(socketId).emit("new_status",populateMessage)
        }
    }
}

return response(res,200,"status created successfully",populateMessage)


    }
    catch(e){
        return response(res,404,'server error',e.message)
    }
}

exports.getStatus=async (req,res)=>{
    try{
        const statuses= await Status.find({
            expiresAt:{$gt:new Date()},
        }).populate("user","username profilePicture")
        .populate("viewers","username profilePicture")
        .sort({createdAt:-1})

        return response(res,200, 'status retrived successfully',statuses)

    }
     catch(e){
        return response(res,404,'server error',e.message)
    }
}
exports.viewStatus=async(req,res)=>{
    const {statusId}=req.params;
    const userId=req.user.userId;
    try{
        const status=await Status.find(statusId);
        if(!status)return response(res,400,'status not found');
        if(!status.viewers.includes(userId)){
            status.viewers.push(userId);
            await status.save();
        }
        const updateStatus=await Status.findById(statusId)
        .populate("user","username,profilePicture")
        .populate("viewers","username profilePicture")

         if(req.io && req.socketUserMap){
            const statusOwnerSocketId=req.socketUserMap.get(status.user._id.toString());
            if(statusOwnerSocketId){
                const viewData={
                    statusId,
                    viewerId:userId,
                    totalViewers:updateStatus.viewers.length,
                    viewers:updateStatus.viewers
                }
                res.io.to(statusOwnerSocketId).emit("status_viewed",viewData)
            }
            else{
                console.log('status owner not connected')
            }
         }

        return response(res,200,'status viewed successfully')
    }
    catch(e){
        return response(res,404,'server error',e.message)
    }
}
exports.deleteStatus=async(req,res)=>{
    const {statusId}=req.params;
    const userId=req.user.userId;
    try{
        const status=await Status.find(statusId);
        if(!status)return response(res,400,'status not found');
        if(status.user.toString()!==userId)return response(res,400,'you are not authorized to perform this');

        await status.deleteOne();
        if(req.io && req.socketUserMap){
            for(const [connectedUserId,socketId] of req.socketUserMap){
        if(connectedUserId!==userId){
            req.io.to(socketId).emit("status_deleted",statusId)
        }
    }
        }

        return response(res,200,'status deleted successfully');
    }
     catch(e){
        return response(res,404,'server error',e.message)
    }
}