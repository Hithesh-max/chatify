// Run the built frontend and API from the same origin, on every platform.
process.env.NODE_ENV ||= "production";
await import("../backend/src/server.js");
