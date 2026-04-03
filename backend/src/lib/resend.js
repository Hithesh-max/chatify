import { Resend } from "resend";
import { ENV } from "./env.js";

export const resendClient = new Resend(ENV.RESEND_API_KEY);
// now since the env.js is created , we need not import "dotenv/config" in other files, 
// we can just import the ENV object from env.js and use the variables from there

// import "dotenv/config" is same as 
//import dotenv from "dotenv";
//dotenv.config();



export const sender = {
  email: ENV.EMAIL_FROM,
  name: ENV.EMAIL_FROM_NAME,
};