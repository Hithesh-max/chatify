import db from "../lib/db.js";
import { saveImage } from "../lib/uploads.js";
import { emitMessage } from "../lib/socket.js";

const validId = (id) => Number.isSafeInteger(Number(id)) && Number(id) > 0 && /^\d+$/.test(String(id));

export function getAllContacts(req, res) {
  const users = db.prepare("SELECT id, fullName, email, profilePic FROM users WHERE id != ? ORDER BY fullName").all(req.user.id);
  res.json(users);
}

export function getMessagesByUserId(req, res) {
  if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid user id" });
  const otherId = Number(req.params.id);
  if (otherId === req.user.id) return res.status(400).json({ message: "Choose another user" });
  if (!db.prepare("SELECT 1 FROM users WHERE id = ?").get(otherId)) return res.status(404).json({ message: "User not found" });
  const messages = db.prepare(`SELECT id, senderId, receiverId, text, image, createdAt FROM messages
    WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) ORDER BY id ASC`)
    .all(req.user.id, otherId, otherId, req.user.id);
  res.json(messages);
}

export function sendMessage(req, res) {
  const receiverId = Number(req.params.id);
  if (!validId(req.params.id) || receiverId === req.user.id) return res.status(400).json({ message: "Invalid receiver" });
  if (!db.prepare("SELECT 1 FROM users WHERE id = ?").get(receiverId)) return res.status(404).json({ message: "Receiver not found" });
  const { text, image } = req.body || {};
  if (typeof text !== "string" || text.length > 2000 || (image != null && typeof image !== "string") || (!text.trim() && !image)) {
    return res.status(400).json({ message: "Enter a message of up to 2000 characters or choose an image" });
  }
  let imageUrl = null;
  try {
    if (image) imageUrl = saveImage(image);
    const result = db.prepare("INSERT INTO messages (senderId, receiverId, text, image) VALUES (?, ?, ?, ?)")
      .run(req.user.id, receiverId, text.trim() || null, imageUrl);
    const message = db.prepare("SELECT id, senderId, receiverId, text, image, createdAt FROM messages WHERE id = ?").get(result.lastInsertRowid);
    emitMessage(message);
    res.status(201).json(message);
  } catch (error) {
    console.error("Send failed", error);
    res.status(400).json({ message: error.message });
  }
}

export function getChatPartners(req, res) {
  const partners = db.prepare(`SELECT u.id, u.fullName, u.email, u.profilePic FROM users u
    WHERE u.id != ? AND EXISTS (SELECT 1 FROM messages m WHERE (m.senderId = ? AND m.receiverId = u.id)
    OR (m.receiverId = ? AND m.senderId = u.id)) ORDER BY u.fullName`)
    .all(req.user.id, req.user.id, req.user.id);
  res.json(partners);
}
