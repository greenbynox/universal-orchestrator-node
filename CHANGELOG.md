# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic-ish versioning (`vMAJOR.MINOR.PATCH`).

## [2.3.0] - 2025-12-16

### Added
- Backend **source of truth** for node modes (`full`/`pruned`/`light`) via `src/core/nodeSupport.ts`.
- Dev scripts:
  - `scripts/dev.ps1` (dev orchestration)
  - `scripts/start-docker.ps1` (Docker start helper)
  - `scripts/install-docker-engine-wsl.ps1` (WSL2 engine helper)
  - `scripts/wait-for-backend.js` (frontend wait on backend)
- Tests to prevent regressions:
  - `tests/nodeSupport.test.ts`
  - `tests/dockerConnection.test.ts`, `tests/nodeConnection.test.ts`, `tests/dockerBinds.test.ts`
  - `tests/settingsStore.test.ts`, `tests/walletPasswordCrypto.test.ts`

### Changed
- **Ethereum**: `light` mode is no longer advertised nor recommended (Geth removed/does not support it). The UI and system recommendations now respect actual support.
- Dev WebSocket behavior: in development, the Socket.IO client connects directly to the backend host/port (reduces Vite WS proxy noise during backend restarts).
- Security hardening:
  - API auth middleware is **fail-closed** for invalid/missing auth configuration in production.
  - WebSocket CORS is aligned with the HTTP allowlist.
  - Sensitive runtime config fields are redacted in WebSocket broadcasts.

### Fixed
- Reduced recurring `ECONNREFUSED`/RPC start race conditions by improving connection selection/retries (especially with WSL2 + Docker over TCP).

### Notes
- To build release artifacts for Windows/Linux/macOS, tag the repo with `v2.3.0` (or later) — see `docs/RELEASE.md`.
