require("dotenv").config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const PORT = 3000;
require('./config/dbConnection');

const userRoutes = require('./routes/userRoute');
const webRoutes = require('./routes/webRoute');

const app = express();

app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(cors());

app.use('/api', userRoutes);
app.use('/',webRoutes);

//error handling
app.use((err, req, res, next)=>{

    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal server error";
    res.status(err.statusCode).json({
        message:err.message,
    });
});

app.listen(PORT, function(){
    console.log(`Server is running on ${PORT}!`);
});
