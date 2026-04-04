import jwt from "jsonwebtoken";
import db from "../lib/db.js";
import { ENV } from "../lib/env.js";
// if protected , i.e check token the go to next tht is update profile ( in auth.route.js)
export const protectRoute = async (req, res, next) => {
  try {
    //chk if token is present in cookies or not
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Unauthorized - No token provided" });
// if token is present then verify it and decode it to get the user id
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) return res.status(401).json({ message: "Unauthorized - Invalid token" });
// if token is valid then find the user with the id from the token and attach it to the req object so that we can use it in the next middleware or controller
    const user = db
      .prepare("SELECT id, fullName, email, profilePic FROM users WHERE id = ?")
      .get(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
