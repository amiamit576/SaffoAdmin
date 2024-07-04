const express = require('express');
const authRouter = express.Router();
const{signUp,signIn}=require('../controller/authController.js')




authRouter.post('/signup',signUp);
authRouter.post("/signin", signIn);

module.exports = authRouter;

