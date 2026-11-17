# Frame° — Startup & Operations

## Requirements

- Node.js **23.6 or newer** (matches `package.json`; the API uses Node's native TypeScript support)
- npm
- Termux, Linux, or macOS

### Termux

```bash
pkg update
pkg upgrade
pkg install nodejs python make clang pkg-config
```

`better-sqlite3` is a native module. The Python/compiler tools are needed if npm has to build it from source.

## First launch

```bash
chmod +x start
./start
```

The launcher creates `.env` with a cryptographically random `JWT_SECRET` if it does not exist, validates the secret, and installs the locked dependencies on first launch. It does not overwrite an existing `.env` or reinstall dependencies on every start.

## Background mode (recommended for Termux)

```bash
./start --background
```

This starts the API and Vite server in the background and returns control to the same shell.

```bash
./start --status   # check whether the launcher is running
./start --logs     # follow logs (Ctrl+C exits the log viewer, not Frame°)
./start --stop     # stop the API and frontend together
```

Logs are written to `logs/frame.log`. The PID file is `.frame.pid`.

Foreground mode remains available with `./start`; press Ctrl+C to stop both services.

## Addresses

- Frontend: http://127.0.0.1:5173/
- API health: http://127.0.0.1:3000/api/health

Vite binds to `0.0.0.0` so it can be reached through a LAN or tunnel. Use a reverse proxy/tunnel with HTTPS before exposing the app publicly.

## Useful commands

```bash
npm run dev        # API + Vite together
npm run client     # Vite only
npm run server     # API with Node watch mode
npm run build      # production frontend build into dist/
npm run typecheck  # strict frontend + backend checks
npm run lint       # ESLint
npm test           # integration tests
```

For production, build the frontend first, then run the API with `NODE_ENV=production npm run start`. The API serves `dist/` when it exists.

## Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 3000) |
| `JWT_SECRET` | Required random secret, at least 24 characters |
| `NODE_ENV` | `production` enables production cookie behavior |
| `FRAME_DB_PATH` | Optional SQLite database path override |
| `FRAME_UPLOADS_DIR` | Optional uploads directory override |

## Data locations

- SQLite database: `server/frame.db`
- Uploaded videos: `server/uploads/videos/`
- Uploaded thumbnails: `server/uploads/thumbnails/`

Back up the database and uploads directory before upgrading or moving the project. Do not commit or share `.env`, the database, or user uploads.
