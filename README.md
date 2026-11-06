# Chatify

Real-time one-to-one chat with React, Express, Socket.IO, and SQLite. Accounts, messages, profile pictures, and chat images persist in `backend/`. Sessions use HTTP-only cookies. Presence follows active socket connections across tabs.

## Run locally (Node 20.19+)

```bash
npm run setup
npm ci --prefix backend
npm ci --prefix frontend
npm run dev
```

Open http://localhost:5173. Sign up two different users and open them in separate browser profiles or an incognito window. The Vite development proxy sends `/api`, `/socket.io`, and `/uploads` to the backend on port 3000. No MongoDB, Arcjet, Cloudinary, or email API keys are needed.

## Build and run from one server

```bash
npm run build
npm run setup
npm start
```

Open http://localhost:3000. `npm start` serves the built frontend in production mode. For deployment, set `JWT_SECRET` to a long random value in the host environment, `NODE_ENV=production`, and `DATA_DIR` to a persistent writable directory. Use **one server instance** with SQLite and in-memory presence; scaling beyond one instance needs a shared database and Socket.IO adapter. A host with an ephemeral disk will lose accounts, messages, and images on restart. Run the backend as a Web Service that supports WebSockets, rather than hosting only `frontend/dist` on a static file host.

The included `backend/database.sqlite` is the existing project database. Keep it to retain existing accounts; back it up before deployment. New installations can omit it and it will be created automatically. The setup script never overwrites an existing secret. Cookies and old login sessions are tied to the secret; after rotating it, users log in again.

## Verify

```bash
npm test
npm run build
npm run lint --prefix frontend
```

The integration test creates an isolated temporary database and checks registration, login, authorization, two-user delivery, multi-tab presence, message history, logout revocation and reconnect.
