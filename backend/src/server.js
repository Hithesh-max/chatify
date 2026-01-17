/*

const express = require("express");
const app = express();
*/
import express from "express";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";


dotenv.config();
const app = express();

const _dirname=path.resolve();
const PORT = process.env.PORT || 3000;
//console.log(process.env.PORT);
//export default app;
/*
this make other files to access app by importing it like import app from './server.js'
*/
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// make ready for deploy
 if(process.env.NODE_ENV==="production"){
    app.use(express.static(path.join(_dirname,"../frontend/dist")));
    app.get("*",(_,res)=>{
        res.sendFile(path.resolve(_dirname,"../frontend/dist/index.html"));
    }
    );

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }
