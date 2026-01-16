import express from "express";
const router = express.Router();

router.get("/send", (req, res) => {
  res.send("send message endpoint!");
});
router.get("/recieve", (req, res) => {
  res.send("recieve endpoint!");
});

export default router;