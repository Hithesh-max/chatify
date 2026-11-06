import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { ENV } from "./env.js";

export const dataDir = path.resolve(ENV.DATA_DIR || path.resolve(import.meta.dirname, "../.."));
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "database.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profilePic TEXT
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId INTEGER NOT NULL REFERENCES users(id),
    receiverId INTEGER NOT NULL REFERENCES users(id),
    text TEXT,
    image TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS messages_conversation ON messages(senderId, receiverId, id);
`);
export default db;
