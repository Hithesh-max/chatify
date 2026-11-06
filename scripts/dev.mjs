import { spawn } from "node:child_process";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const args = process.platform === "win32" ? ["run", "dev", "--prefix"] : ["run", "dev", "--prefix"];
const children = ["backend", "frontend"].map((name) => spawn(process.platform === "win32" ? "npm.cmd" : "npm", [...args, name], {
  cwd: root, stdio: "inherit", env: { ...process.env, NODE_ENV: "development" }, shell: process.platform === "win32",
}));
const stop = () => children.forEach((child) => child.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
children.forEach((child) => child.on("exit", (code) => { if (code) { stop(); process.exitCode = code; } }));
