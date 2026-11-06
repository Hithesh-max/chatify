import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
const file = path.resolve(import.meta.dirname, "../backend/.env");
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, `JWT_SECRET=${randomBytes(48).toString("hex")}\n`, { mode: 0o600, flag: "wx" });
  console.log("Created backend/.env with a unique JWT secret");
} else console.log("Kept the existing backend/.env");
