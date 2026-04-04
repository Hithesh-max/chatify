import express from "express";
import { signup, login, logout, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middlware.js";
const router = express.Router();

router.use(arcjetProtection);
router.post("/signup", signup);
router.post("/login",  login);
router.post("/logout", logout);
router.post("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, (req, res) => {
  res.status(200).json({ message: "Authenticated", user: req.user });
});
export default router;




//429 - too many requests
/*

import express from "express"; 

const router = express.Router();

router.get("/signup", (req, res) => {
  res.send("signup endpoint!");
});
router.get("/login", (req, res) => {
  res.send("login endpoint!");
});
router.get("/logout", (req, res) => {
  res.send("logout endpoint!");
});

router.post("/data", (req, res) => {
  res.send("Data received");
});
export default router;
*/
