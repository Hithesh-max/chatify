import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";

const root = path.resolve(import.meta.dirname, "../..");
const requireFrontend = createRequire(path.join(root, "frontend/package.json"));
const { io } = requireFrontend("socket.io-client");
const portServer = net.createServer();
const freePort = () => new Promise((resolve) => {
  portServer.listen(0, "127.0.0.1", () => {
    const port = portServer.address().port;
    portServer.close(() => resolve(port));
  });
});
const event = (emitter, name, predicate = () => true) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => { emitter.off(name, handler); reject(new Error(`Timed out waiting for ${name}`)); }, 4000);
  const handler = (value) => {
    if (!predicate(value)) return;
    clearTimeout(timer);
    emitter.off(name, handler);
    resolve(value);
  };
  emitter.on(name, handler);
});

test("authenticated two-user chat, session revocation and presence", { timeout: 30000 }, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "chatify-test-"));
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, ["backend/src/server.js"], {
    cwd: root, env: { ...process.env, DATA_DIR: directory, JWT_SECRET: "test-secret-only", PORT: String(port), NODE_ENV: "development" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  server.stderr.on("data", (chunk) => { output += chunk.toString(); });
  const sockets = [];
  const request = async (url, method = "GET", body, cookie) => {
    const res = await fetch(`${base}${url}`, {
      method,
      headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json(), cookie: res.headers.get("set-cookie")?.split(";")[0] };
  };
  const connect = async (cookie) => {
    const socket = io(base, { autoConnect: false, transports: ["websocket"], extraHeaders: { cookie } });
    sockets.push(socket);
    const connected = event(socket, "connect");
    socket.connect();
    await connected;
    return socket;
  };
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw new Error(`Server failed: ${output}`);
      try { await fetch(`${base}/api/auth/check`); ready = true; break; } catch { await new Promise((r) => setTimeout(r, 50)); }
    }
    assert.ok(ready, `Server did not start: ${output}`);
    assert.equal((await request("/api/messages/contacts")).status, 401);
    const alice = await request("/api/auth/signup", "POST", { fullName: "Alice", email: "ALICE@example.com", password: "password1" });
    const bob = await request("/api/auth/signup", "POST", { fullName: "Bob", email: "bob@example.com", password: "password2" });
    assert.equal(alice.status, 201);
    assert.equal(bob.status, 201);
    assert.equal(alice.data.email, "alice@example.com");
    assert.equal(alice.data.password, undefined);
    assert.equal((await request("/api/auth/login", "POST", { email: "alice@example.com", password: "wrong" })).status, 401);
    const login = await request("/api/auth/login", "POST", { email: "alice@example.com", password: "password1" });
    assert.equal(login.status, 200);
    const anonymous = io(base, { autoConnect: false, transports: ["websocket"] });
    sockets.push(anonymous);
    const denied = event(anonymous, "connect_error");
    anonymous.connect();
    assert.equal((await denied).message, "Unauthorized");
    const a1 = await connect(login.cookie);
    const a2 = await connect(login.cookie);
    const b = await connect(bob.cookie);
    assert.deepEqual(new Set(await event(b, "getOnlineUsers", (ids) => ids.includes(String(alice.data.id)) && ids.includes(String(bob.data.id)))), new Set([String(alice.data.id), String(bob.data.id)]));
    const receiveB = event(b, "newMessage");
    const receiveA = event(a1, "newMessage");
    const sent = await request(`/api/messages/send/${bob.data.id}`, "POST", { text: "Hi Bob" }, login.cookie);
    assert.equal(sent.status, 201);
    assert.equal((await receiveB).id, sent.data.id);
    assert.equal((await receiveA).id, sent.data.id);
    assert.equal((await request(`/api/messages/${alice.data.id}`, "GET", null, bob.cookie)).data[0].text, "Hi Bob");
    assert.equal((await request("/api/messages/chats", "GET", null, bob.cookie)).data[0].id, alice.data.id);
    assert.equal((await request("/api/messages/send/99999", "POST", { text: "bad" }, login.cookie)).status, 404);
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/eQUAAAAASUVORK5CYII=";
    const profile = await request("/api/auth/update-profile", "POST", { profilePic: png }, login.cookie);
    assert.equal(profile.status, 200);
    assert.ok(profile.data.profilePic.startsWith("/uploads/"));
    assert.equal((await fetch(base + profile.data.profilePic)).status, 200);
    assert.equal((await request("/api/auth/update-profile", "POST", { profilePic: "data:image/svg+xml;base64,PHN2Zz4=" }, login.cookie)).status, 400);
    const imageMessage = await request(`/api/messages/send/${bob.data.id}`, "POST", { text: "image", image: png }, login.cookie);
    assert.equal(imageMessage.status, 201);
    assert.equal((await fetch(base + imageMessage.data.image)).status, 200);
    a1.disconnect();
    const stillOnline = await event(b, "getOnlineUsers", (ids) => ids.includes(String(alice.data.id)));
    assert.ok(stillOnline.includes(String(alice.data.id)));
    const offline = event(b, "getOnlineUsers", (ids) => !ids.includes(String(alice.data.id)));
    const disconnected = event(a2, "disconnect");
    assert.equal((await request("/api/auth/logout", "POST", null, login.cookie)).status, 200);
    await disconnected;
    await offline;
    assert.equal((await request("/api/auth/check", "GET", null, login.cookie)).status, 401);
    const relogin = await request("/api/auth/login", "POST", { email: "alice@example.com", password: "password1" });
    assert.equal((await request(`/api/messages/${bob.data.id}`, "GET", null, relogin.cookie)).data[0].id, sent.data.id);
  } finally {
    sockets.forEach((socket) => socket.disconnect());
    server.kill("SIGTERM");
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
