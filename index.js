const express =require('express');
const cookieparser=require('cookie-parser');
const cors =require('cors');
const dotenv=require('dotenv');
const connecttodb = require('./config/connect_to_db');
const bodyParser=require('body-parser');
const authRoute=require('./routes/authRoute');
const chatRoute=require('./routes/chatRoute')
const http=require('http')
const initializeSocket=require('./services/soketService')
const statusRoute=require('./routes/statusRoute')

dotenv.config();

const PORT=process.env.PORTT;
const app=express();

const corsOption={
    origin:process.env.FRONTEND_URL,
    credentials:true
}

app.use(cors(corsOption))
app.use(express.json());
app.use(cookieparser());
app.use(bodyParser.urlencoded({extended:true}));

//  database connection
 connecttodb();

 const server=http.createServer(app);
 const io=initializeSocket(server);

 app.use((req,res,nect)=>{
    req.io=io;
    req.socketUserMap=io.socketUserMap
    next();
 })

// routes
app.get('/', (req, res) => {
    res.send("Server working");
});
app.use('/auth',authRoute)
app.use('/chat',chatRoute)
app.use('/status',statusRoute)

app.listen(PORT,()=>{
    console.log(`server running on PORT ${PORT}`);
})
