/*

const express = require("express");
const app = express();
*/
import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;
//console.log(process.env.PORT);
//export default app;
/*
this make other files to access app by importing it like import app from './server.js'
*/
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
