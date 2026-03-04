const mongoose =require('mongoose');

const connecttodb=async()=>{
    try{
        console.log(process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to database");
    }
    catch(e){
        console.log(e);
    }
}
module.exports=connecttodb