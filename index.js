const express =require('express');
const ookieparser=require('cookie-parser');
const cors =require('cors');
const dotenv=require('dotenv');
const connecttodb = require('./config/connect_to_db');

dotenv.config();

const PORT=process.env.PORT;
const app=express();

// database connection
connecttodb();



app.listen(PORT,()=>{
    console.log(`server running on PORT ${PORT}`);
})