import db from "../lib/db.js";
import { verifySession } from "../lib/utils.js";

export function protectRoute(req, res, next) {
  try {
    const session = req.cookies.jwt && verifySession(req.cookies.jwt);
    if (!session) return res.status(401).json({ message: "Please log in" });
    const user = db.prepare("SELECT id, fullName, email, profilePic FROM users WHERE id = ?").get(session.userId);
    if (!user) return res.status(401).json({ message: "Please log in" });
    req.user = user;
    req.sessionId = session.sessionId;
    next();
  } catch {
    res.status(401).json({ message: "Please log in" });
  }
}
