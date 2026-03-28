const express =require('express');
const cookieparser=require('cookie-parser');
const cors =require('cors');
const dotenv=require('dotenv');
const connecttodb = require('./config/connect_to_db');
const bodyParser=require('body-parser');
const authRoute=require('./routes/authRoute');
const chatRoute=require('./routes/chatRoute')


dotenv.config();

const PORT=process.env.PORTT;


const app=express();
app.use(cors())
app.use(express.json());
app.use(cookieparser());
app.use(bodyParser.urlencoded({extended:true}));

//  database connection
 connecttodb();

// routes
app.get('/', (req, res) => {
    res.send("Server working");
});
app.use('/auth',authRoute)
app.use('/chat',chatRoute)


app.listen(PORT,()=>{
    console.log(`server running on PORT ${PORT}`);
})
