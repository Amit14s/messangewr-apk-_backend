const mongoose =require('mongoose');

const connecttodb=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to database");
    }
    catch(e){
        console.log(e);
    }
}
module.exports=connecttodb