
const express= require ('express');
const cors = require('cors');
const authRouter = require('./router/authRoute.js');
const dbConnection = require('./config/databseConfig.js');
const cookieParser = require('cookie-parser');



const app= express();
dbConnection


// use to serialize  the data
app.use(express.json())
app.use(cookieParser()); 


app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ['GET', 'POST', 'PUT', "DELETE"],
    credentials: true
}))



app.use('/api/auth',authRouter);

app.use('/',(req,res)=>{

    res.status(200).json({
        data: "JWTAuth server"
    })


})



module.exports=app