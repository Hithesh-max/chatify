import bcrypt from "bcryptjs";
import db from "../lib/db.js";
import { generateToken, verifySession } from "../lib/utils.js";
import { disconnectSession } from "../lib/socket.js";
import { ENV } from "../lib/env.js";
import { saveImage } from "../lib/uploads.js";

const publicUser = (id) => db.prepare("SELECT id, fullName, email, profilePic FROM users WHERE id = ?").get(id);

export async function signup(req, res) {
  try {
    const { fullName, email, password } = req.body || {};
    if (typeof fullName !== "string" || !fullName.trim() || fullName.trim().length > 80 ||
        typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254 ||
        typeof password !== "string" || password.length < 6 || password.length > 128) {
      return res.status(400).json({ message: "Enter a name, valid email and password of 6–128 characters" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (db.prepare("SELECT 1 FROM users WHERE lower(email) = ?").get(normalizedEmail)) {
      return res.status(409).json({ message: "That email is already registered" });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare("INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)")
      .run(fullName.trim(), normalizedEmail, hash);
    generateToken(Number(result.lastInsertRowid), res);
    res.status(201).json(publicUser(result.lastInsertRowid));
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return res.status(409).json({ message: "That email is already registered" });
    console.error("Signup failed", error);
    res.status(500).json({ message: "Could not create account" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") return res.status(400).json({ message: "Email and password are required" });
    const user = db.prepare("SELECT * FROM users WHERE lower(email) = ?").get(email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid credentials" });
    generateToken(user.id, res);
    res.json(publicUser(user.id));
  } catch (error) {
    console.error("Login failed", error);
    res.status(500).json({ message: "Could not log in" });
  }
}

export function logout(req, res) {
  try {
    const session = req.cookies.jwt && verifySession(req.cookies.jwt);
    if (session) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(session.sessionId);
      disconnectSession(session.sessionId);
    }
  } catch { /* Expired cookies may still be cleared. */ }
  res.clearCookie("jwt", { httpOnly: true, sameSite: "lax", secure: ENV.NODE_ENV === "production", path: "/" });
  res.json({ message: "Logged out" });
}

export function updateProfile(req, res) {
  try {
    const image = saveImage(req.body?.profilePic);
    db.prepare("UPDATE users SET profilePic = ? WHERE id = ?").run(image, req.user.id);
    res.json(publicUser(req.user.id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
