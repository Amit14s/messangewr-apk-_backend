const response=require('../utils/responseHandler')
const Conversation=require('../models/conversation');
const { uploadToCloudinary } = require('../config/cloudinaryConfig');
const Message=require("../models/messages")

exports.sendMessage= async(req,res)=>{
    try{
  const {senderId,receiverId,content,messageStatus}=req.body;
  const file=req.file;
  const participants=[senderId,receiverId].sort();
  let conversation=await Conversation.findOne({
    participants:participants
  });
  if(!conversation){
    conversation=new Conversation({
        participants
    });
    await conversation.save();
  }
  let imageOrVideoUrl=null;
  let contentType=null;
  if(file){
    const uploadfile=await uploadToCloudinary(file);
    if(!uploadfile?.secure_url)return response(res,400,'failed to upload file')
    imageOrVideoUrl=uploadfile?.secure_url;
    if(file.mimetype.startWith('image'))contentType="image"
    else if(file.mimetype.startWith('video'))contentType="video"
    else return response(res,400,'unsupported file type')
  }
  else if(content?.trim())contentType='text';
  else return response(res,400,'message content is required');

   const message=new Message({
    conversation:conversation?._id,
    sender:senderId,
    receiver:receiverId,
    content,
    contentType,
    imageOrVideoUrl
   })
await message.save();
if(message?.content){
    conversation.lastMessage=message?.id
}
conversation.unreadCount+=1;
await conversation.save();

const populateMessage=await Message.findOne(message?._id).populate("sender","username profilePicture").populate("receiver","username profilePicture")

return response(res,200,"message sent successfully",populateMessage)


    }
    catch(e){
        return response(res,404,'cannot send message',e.message)
    }
}

 exports.getConversation=async (req,res)=>{
    const userId=req.user.userId;
    try{
        let conversation=await Conversation.find({participants:userId}).populate("participants","username profilePicture isOnline lastSeen").populate({
            path:"sender receiver",
            select:"username profilePicture"
        }).sort({updatedAt:-1})
        return response(res,201,"conversation get successful",conversation)
    }
     catch(e){
        return response(res,404,'cannot send message',e)
    }
 }
 exports.getMessage=async(req,res)=>{
    const {conversationId}=req.params;
    const userId=req.user.userId;
    try{
       const conversation=await Conversation.findById(conversationId);
       if(!conversation)return response(res,404,"conversation not found");
       if(!conversation.participants.includes(userId))return response(res,404,"not authorized");
       const message=await Message.find({conversation:conversationId}).populate("sender","username profilePicture").populate("receiver","username profilePicture").sort("createdAt")

       await Message.updateMany(
        {
            conversation:conversationId,
            receiver:userId,
            messageStatus:{$in:["send", "delivered"]},
        },
        {$set:{messageStatus:"read"}}
       );
       conversation.unreadCount=0;
       await conversation.save();
       return response(res,200,"message retrived",message)
    }
    catch(e){
        return response(res,404,'cannot send message',e)
    }
 }
 
 exports.markAsRead=async(req,res)=>{
    const {messageIds}=req.body;
    const userId=req.user.userId;
    try{
      let messages=await Message.find({
        _id:{$in:messageIds},
        receiver:userId,
      })

      await Message.updateMany(
        {_id:{$in:messageIds},receiver:userId},
        {$set:{messageStatus:"read"}}
      )
      return response(res,200,"message marked as read",messages)
    }
       catch(e){
        return response(res,404,'Problem occured',e)
    } 
 }
 exports.deleteMessage=async(req,res)=>{
    const {messageId}=req.params;
    const userId=req.user.userId;
    try{
          const message=await Message.findById(messageId);
          if(!message)return response(res,404,'message not found');
          if(message.sender.toString!==userId)return response(res,404,"not authorized to delete");
          await message.deleteOne();
          return response(res,200,"message deleted successfully");
    }
     catch(e){
        return response(res,404,'Problem occured',e)
    } 
 }