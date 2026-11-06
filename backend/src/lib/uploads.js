import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dataDir } from "./db.js";

export const uploadsDir = path.join(dataDir, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

export function saveImage(dataUrl) {
  if (typeof dataUrl !== "string") throw new Error("Invalid image");
  const match = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) throw new Error("Use a PNG, JPEG, WebP, or GIF image");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > 4 * 1024 * 1024) throw new Error("Image must be under 4 MB");
  const signatures = {
    png: bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
    jpeg: bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    webp: bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP",
    gif: ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6)),
  };
  if (!signatures[match[1]]) throw new Error("Invalid image data");
  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const name = `${randomUUID()}.${extension}`;
  fs.writeFileSync(path.join(uploadsDir, name), bytes, { flag: "wx" });
  return `/uploads/${name}`;
}
