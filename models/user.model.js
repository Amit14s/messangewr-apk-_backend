const mongoose =require('mongoose');

const userschema=new mongoose.Schema({
    phoneNumber:{type:String,unique:true,sparse:true},
    phoneSuffix:{type:String,unique:false},
    username:{type:String},
    email:{
        type:String,
        lowercase:true,
         trim: true, // Removes leading/trailing whitespace
       match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
    },
    emailOtp:{type:String},
    emailOtpExpiry:{type:Date},
    profilePicture:{type:String},
    about:{type:String},
    lastSeen:{type:String},
    isOnline:{type:Boolean,default:false},
    isVerified:{type:Boolean,default:false},
    agreed:{type:Boolean,default:false},
},{
    timestamps:true
})

const user=mongoose.model('user',userschema);
module.exports=user;