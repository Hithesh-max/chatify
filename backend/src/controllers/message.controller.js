import cloudinary from "../lib/cloudinary.js";
import db from "../lib/db.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const filteredUsers = db
      .prepare(
        "SELECT id, fullName, email, profilePic FROM users WHERE id != ? ORDER BY fullName ASC"
      )
      .all(loggedInUserId);

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user.id;
    const userToChatId = Number(req.params.id);

    if (Number.isNaN(userToChatId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const messages = db
      .prepare(
        `SELECT id, senderId, receiverId, text, image, createdAt
         FROM messages
         WHERE (senderId = ? AND receiverId = ?)
            OR (senderId = ? AND receiverId = ?)
         ORDER BY datetime(createdAt) ASC, id ASC`
      )
      .all(myId, userToChatId, userToChatId, myId);

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = Number(req.params.id);
    const senderId = req.user.id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (Number.isNaN(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver id." });
    }
    if (senderId === receiverId) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(receiverId);

    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const result = db
      .prepare(
        `INSERT INTO messages (senderId, receiverId, text, image)
         VALUES (?, ?, ?, ?)`
      )
      .run(senderId, receiverId, text ?? null, imageUrl ?? null);

    const newMessage = db
      .prepare(
        `SELECT id, senderId, receiverId, text, image, createdAt
         FROM messages
         WHERE id = ?`
      )
      .get(result.lastInsertRowid);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    const chatPartners = db
      .prepare(
        `SELECT DISTINCT u.id, u.fullName, u.email, u.profilePic
         FROM users u
         JOIN messages m
           ON (u.id = m.senderId AND m.receiverId = ?)
           OR (u.id = m.receiverId AND m.senderId = ?)
         WHERE u.id != ?
         ORDER BY u.fullName ASC`
      )
      .all(loggedInUserId, loggedInUserId, loggedInUserId);

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
