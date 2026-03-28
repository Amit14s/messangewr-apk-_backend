const mongoose=require('mongoose');

const statusSchema=new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId,ref:'user',required:true},
    content:{type:String,required:true},
    contentType:{type:String,enum:['image','video','text'],default:'text'},
    viewers:[{type:mongoose.Schema.Types.ObjectId,ref:'user'}],
    expiresAt:{type:Date,required:true}
},{
    timestampsL:true
})

const status=monggose.model('status',statusSchema);
module.exports=status;