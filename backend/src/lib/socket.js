import { Server } from "socket.io";
import http from "node:http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

export const app = express();
export const server = http.createServer(app);
export const io = new Server(server, {
  cors: ENV.CLIENT_URL ? { origin: ENV.CLIENT_URL, credentials: true } : undefined,
});
const connections = new Map(); // user id -> Set of socket ids, supports multiple tabs
io.use(socketAuthMiddleware);
io.on("connection", (socket) => {
  const id = String(socket.user.id);
  socket.join(`user:${id}`);
  socket.join(`session:${socket.sessionId}`);
  const sockets = connections.get(id) || new Set();
  sockets.add(socket.id);
  connections.set(id, sockets);
  io.emit("getOnlineUsers", [...connections.keys()]);

  socket.on("disconnect", () => {
    sockets.delete(socket.id);
    if (!sockets.size) connections.delete(id);
    io.emit("getOnlineUsers", [...connections.keys()]);
  });
});

export function disconnectSession(sessionId) {
  io.in(`session:${sessionId}`).disconnectSockets(true);
}

export function emitMessage(message) {
  io.to(`user:${message.receiverId}`).to(`user:${message.senderId}`).emit("newMessage", message);
}
