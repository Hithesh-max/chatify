import bcrypt from "bcryptjs";
import db from "../lib/db.js";
import { generateToken } from "../lib/utils.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (existingUser) {
      
       return res.status(400).json({ message: "Unable to create account. Please try again or contact support." });
    

    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = db
      .prepare(
        "INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)"
      )
      .run(fullName, email, hashedPassword);

    const newUser = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(result.lastInsertRowid);

    generateToken(newUser.id, res);

    try {
      await sendWelcomeEmail(
        newUser.email,
        newUser.fullName,
        ENV.CLIENT_URL
      );
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }

    res.status(201).json({
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    console.log("Error in signup controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
 


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user.id, res);

    res.status(200).json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
   
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: "strict",
   });
     res.status(200).json({ message: "Logged out successfully" });
   } catch (error){
    console.log("Error in logout controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



















/*

import User from "../models/user.model.js";
import bycrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signup= async (req, res) => {
  const{fullName,email,password}=req.body;

  try {
    if( !fullName || !email || !password){
      return res.status(400).json({message:"All fields are required"});
    }
    if( password.length < 6){
      return res.status(400).json({message:"Password must be at least 6 characters"});
    }
    // chk if email is valid 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
   // user already exists so... find if any email matches 
    const user= await User.findOne({email:email});
    if(user){
      return res.status(400).json({message:"User already exists"});
    }

  // else crate new user
   const salt= await bycrypt.genSalt(10);
   // now hash the password tht user sends with the salt
   const hashedPassword= await bycrypt.hash(password,salt);


    const newUser= new User({
      fullName,
      email,
      password:hashedPassword
    });

    if(newUser){

      generateToken(newUser._id,res);
      //200 - success
      //201 smthing created successfully
      //500 - internal server error
      await newUser.save();
      res.status(201).json({
        _id:newUse.id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic
      });
    } else{
      res.status(400).json({message:"Invalid user data"});
    }



  } catch (error) {
    console.log("error in signup controller",error);
     res.status(500).json({message:"Internal server error"});
  }
}
  */
