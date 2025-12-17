# Development guide

## Prerequisites

- Node.js 20+ (recommended)
- Docker (Desktop or WSL2 engine)

## Start dev (Windows)

- `npm run dev` uses `scripts/dev.ps1`.

It typically orchestrates:
- backend API (TypeScript)
- Vite frontend

## WebSocket / Socket.IO in dev

To reduce proxy-related WS noise during backend restarts, the frontend can connect directly to the backend.

Set in `frontend/.env` (see `frontend/.env.example`):

- `VITE_BACKEND_HOST=127.0.0.1`
- `VITE_BACKEND_PORT=3001`

## Useful scripts

- `scripts/start-docker.ps1`: helper to start Docker (Desktop/WSL2 scenarios)
- `scripts/wait-for-backend.js`: waits for backend readiness before starting the frontend
