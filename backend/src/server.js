import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";
import { uploadsDir } from "./lib/uploads.js";
import "./lib/db.js";

if (!ENV.JWT_SECRET) throw new Error("JWT_SECRET is required. Run npm run setup or set it in the environment.");
app.disable("x-powered-by");
app.use(express.json({ limit: "7mb" }));
app.use(cookieParser());
if (ENV.CLIENT_URL) app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use("/uploads", express.static(uploadsDir));
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (ENV.NODE_ENV === "production") {
  const dist = path.resolve(import.meta.dirname, "../../frontend/dist");
  app.use(express.static(dist));
  app.get("*", (_, res) => res.sendFile(path.join(dist, "index.html")));
}
server.listen(ENV.PORT || 3000, () => console.log(`Chatify listening on ${ENV.PORT || 3000}`));
