import express from "express";
import { signup, login, logout } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;





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