
# Frame° — Startup Procedure

This guide explains how to install, configure, start, and maintain Frame°.

## 1. Requirements

- Node.js **23.6 or newer** (the backend runs TypeScript directly via Node's
  native type stripping; no extra transpiler is installed)
- npm
- Termux (Android), Linux, or macOS

### Termux dependencies

```bash
pkg update
pkg install nodejs-lts python make clang pkg-config
```

`better-sqlite3` is a native dependency. If installation fails on Termux, install
the build tools above and retry.

Note for Termux: npm's `.bin` shims can be unreliable in this environment, so
all package scripts invoke tools through `node <module-path>` directly. Use the
npm scripts below instead of calling `vite` / `tsc` globally.

## 2. Project structure

```text
frame/
├── package.json
├── vite.config.ts
├── tsconfig.json          # frontend (strict)
├── tsconfig.server.json   # backend + tests (strict, NodeNext)
├── eslint.config.mjs
├── .env
├── index.html
├── pages/                 # multi-page HTML shells
├── public/                # favicon + placeholder assets
├── scripts/
│   └── dev.mjs            # runs API + Vite dev server together
├── src/                   # React 19 + TypeScript + Tailwind frontend
│   ├── components/
│   ├── entries/           # one entry per page
│   ├── pages/
│   ├── services/api.ts    # typed API client
│   └── types.ts
├── tests/                 # node:test integration suite
└── server/                # Express 5 backend (TypeScript)
    ├── config.ts          # env + paths
    ├── db.ts              # SQLite schema + indexes
    ├── index.ts           # app bootstrap
    ├── middleware/        # auth, security, rate limits, errors
    ├── routes/            # auth, videos, users
    ├── services/          # data access layer
    └── uploads/           # user media (videos/, thumbnails/)
```

## 3. First-time startup

```bash
chmod +x start
./start
```

The script automatically:

1. Checks Node.js and npm.
2. Creates `.env` with a strong random `JWT_SECRET` if missing.
3. Installs dependencies if `node_modules` is missing.
4. Starts the frontend and backend together.

## 4. Access Frame°

**Frontend (dev):** http://localhost:5173/
**API health check:** http://localhost:3000/api/health

Keep the terminal running while using the application. Press `Ctrl+C` to stop.

## 5. Commands

```bash
npm run dev        # API + Vite dev server together
npm run client     # Vite dev server only
npm run server     # API only (watch mode)
npm run start      # API only (production mode)
npm run build      # production frontend build into dist/
npm run typecheck  # strict TS check (frontend + backend)
npm run lint       # ESLint
npm test           # integration tests (isolated temp DB, safe to run anytime)
```

## 6. Database

SQLite via `better-sqlite3` (WAL mode, foreign keys on). The database is created
automatically at:

```text
server/frame.db
```

Override the location (useful for backups or tests):

```bash
FRAME_DB_PATH=/path/to/frame.db FRAME_UPLOADS_DIR=/path/to/uploads npm run start
```

Uploaded files live in `server/uploads/videos/` and `server/uploads/thumbnails/`.

> Historical note: very early versions stored the database in a directory whose
> name was URL-encoded (`Frame%C2%B0`) due to a path-resolution bug. If such a
> directory exists next to this project, copy its `server/frame.db` over the one
> above (with the server stopped) to recover the original data.

## 7. Production deployment

`npm run build`, then run the API with `NODE_ENV=production`:

```bash
NODE_ENV=production npm run start
```

The backend then:

- serves the built frontend from `dist/` (immutable asset caching),
- sets `secure` on session cookies,
- serves uploads with long-lived cache headers.

Before exposing Frame° publicly, put HTTPS in front of it (the zrok tunnel or
any reverse proxy) and back up `server/frame.db` regularly.

Environment variables:

| Variable             | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `PORT`               | API port (default 3000)                   |
| `JWT_SECRET`         | Required, at least 24 random characters   |
| `NODE_ENV`           | `production` enables secure cookies       |
| `FRAME_DB_PATH`      | SQLite file location override             |
| `FRAME_UPLOADS_DIR`  | Uploads location override                 |

## 8. API overview

All endpoints return JSON. Errors use `{ "error": "message" }`.

- `GET  /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET  /api/videos` — `?search=&limit=&offset=&sort=newest|oldest|popular|liked`
- `GET  /api/videos/:id` — records a view (deduplicated per user for 60s)
- `POST /api/videos` — multipart upload (`video`, optional `thumbnail`,
  `title`, `description`, `durationSeconds`)
- `DELETE /api/videos/:id` — owner only
- `POST /api/videos/:id/like`, `POST /api/videos/:id/star`
- `GET  /api/users/me` — profile + stats, `PATCH /api/users/me` — rename,
  `PATCH /api/users/me/password` — change password
- `GET  /api/users/me/starred`, `GET /api/users/me/videos`

Rate limits: 300 requests/min on `/api`, 30 per 15 min on auth + password routes.

## 9. Troubleshooting

### Dependency installation fails on Termux

```bash
pkg install python make clang pkg-config
npm install
```

### Port already in use

Stop the previous Frame° process before restarting.

### JWT configuration error

`.env` must contain a `JWT_SECRET` of at least 24 characters. Restart after changing it.

### Uploads not working

Ensure `server/uploads/videos/` and `server/uploads/thumbnails/` are writable.
