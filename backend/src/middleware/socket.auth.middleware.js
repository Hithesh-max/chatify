import { verifySession } from "../lib/utils.js";
import { parse } from "cookie";
import db from "../lib/db.js";


export const socketAuthMiddleware = (socket, next) => {
  try {
    const token = parse(socket.handshake.headers.cookie || "").jwt;
    if (!token) return next(new Error("Unauthorized"));
    const session = verifySession(token);
    if (!session) return next(new Error("Unauthorized"));
    const { userId } = session;
    const user = db.prepare("SELECT id, fullName FROM users WHERE id = ?").get(userId);
    if (!user) return next(new Error("Unauthorized"));
    socket.user = user;
    socket.sessionId = session.sessionId;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
};
