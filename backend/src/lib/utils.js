import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import db from "./db.js";
import { ENV } from "./env.js";

export function generateToken(userId, res) {
  const sessionId = randomUUID();
  db.prepare("INSERT INTO sessions (id, userId) VALUES (?, ?)").run(sessionId, userId);
  const token = jwt.sign({ userId, sessionId }, ENV.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: ENV.NODE_ENV === "production",
    path: "/",
  });
  return sessionId;
}

export function verifySession(token) {
  const payload = jwt.verify(token, ENV.JWT_SECRET);
  if (!payload.sessionId) return null;
  const session = db.prepare("SELECT userId FROM sessions WHERE id = ?").get(payload.sessionId);
  return session?.userId === payload.userId ? payload : null;
}
