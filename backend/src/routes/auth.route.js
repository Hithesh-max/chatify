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