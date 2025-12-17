# Security Audit (static) — Node Orchestrator v2.3.0

Date: 2025-12-13  
Scope: `src/` (backend), `frontend/` (UI), `electron/` (packaging + embedded server), Docker deployment files.

> This is a static, source-based review (no external pentest). The project is a **local orchestrator** that can become remotely reachable if the host/port/CORS/auth are misconfigured. The highest risks come from (1) auth defaults, (2) realtime channel exposure, and (3) Docker socket access.

## Executive summary

### What’s strong already
- **Docker image allowlist + sanitization** in `src/core/security.ts` (explicit tag required, rejects suspicious characters, patterns/registries allowlist).
- **Path traversal protections** in `sanitizePath()` (`realpath` + base dir containment checks).
- **Secrets redaction in logs** in `src/utils/logger.ts` (key-based redaction + patterns).
- **CORS allowlist** on HTTP routes in `src/server.ts`.
- **Rate limiting** supported (production toggles) + stricter auth rate limit.
- **Wallet file permissions**: wallets directory `0o700`, file `0o600` (`src/core/WalletManager.ts`).
- **Local-only defaults for node RPC/WS exposure** (host bound to `127.0.0.1`) were implemented previously.

### Highest-risk findings (actionable)
1) **Auth bypass defaults to ON unless explicitly enforced**
   - File: `src/utils/auth.ts` (`requireAuth`)  
   - Risk: If deployed beyond localhost without setting `ENFORCE_AUTH=true`, “protected” endpoints become effectively public.
   - Recommendation: Make production fail-closed by default (e.g., `ENFORCE_AUTH=true` required, otherwise refuse to boot), and document a safe “local only” mode.

2) **Wallet “password” security is misleading / not implemented in TS backend**
   - Files: `src/api/wallets.ts`, `src/core/WalletManager.ts`, `src/types/index.ts`, `frontend/src/pages/WalletsPage.tsx`, `frontend/src/services/api.ts`.
   - Evidence:
     - Backend `CreateWalletRequest` has **no password field**; backend ignores the password sent by UI.
     - `WalletManager.exportSeed()` contains `// TODO` and currently checks only `password.length >= 8` then decrypts and returns the seed.
     - Frontend calls `/wallets/:id/seed` + expects returned `mnemonic`, but backend exposes `/wallets/:id/export-seed` and does not return `mnemonic` on creation.
   - Risk: Users may believe seeds are protected by their password, but any “valid-looking” password can export the seed (subject to route auth).
   - Recommendation: Unify wallet API/behavior:
     - Either implement real per-wallet password protection (hash + verify, and ideally password-based encryption of the seed),
     - Or remove password prompts from UI and clearly state encryption is bound to the app’s master key.

3) **Docker socket / daemon control is inherently a privileged boundary**
   - Files: `docker-compose.yml`, `Dockerfile`, `src/core/NodeManager.ts`, `SECURITY.md`.
   - Risk: If the app (or attacker) can control Docker, it can often reach root-equivalent on the host (classic `docker.sock` risk).
   - Recommendation:
     - Prefer running this as a **local desktop app** only.
     - If serverized, isolate Docker access (rootless Docker, restricted API proxy, separate host/VM).
     - Keep the container hardening already present (`cap_drop`, `no-new-privileges`, `read_only`, `tmpfs`).

## Changes applied during this audit (safe hardening)

These are low-risk security hardenings that do not change user-visible APIs:

1) **Fail-closed for unknown/misconfigured API auth modes**
- File: `src/middleware/apiAuth.ts`
- Before: unknown `API_AUTH_MODE` logged then **allowed**.
- After: unknown mode returns **500** (misconfigured) in production, allows only in dev.
- Also: if `API_AUTH_MODE=token` but `API_TOKEN` missing (or basic creds missing), now returns **500**.

2) **WebSocket channel hardened**
- File: `src/websocket/index.ts`
- Changes:
  - CORS origin is now restricted to the same allowlist logic as HTTP (instead of `origin: '*'`).
  - `nodes:subscribe` / `nodes:unsubscribe` now validates `nodeId`.
  - WebSocket broadcasts now **redact `config.customConfig`** to avoid leaking secrets (e.g., RPC credentials).

3) **Production CSP tightened**
- File: `src/server.ts`
- `helmet` CSP now uses `unsafe-inline`/`unsafe-eval` **only in dev**; production uses `script-src 'self'`.

## Findings (detailed)

### Critical

#### C1 — Auth bypass defaults to enabled
- File: `src/utils/auth.ts`
- Details: `requireAuth()` injects a mock admin unless `ENFORCE_AUTH=true`.
- Impact: If `HOST` is set to `0.0.0.0` or deployed behind a reverse proxy, anyone on the network can call admin APIs.
- Fix: In production, refuse to start unless `ENFORCE_AUTH=true` (or equivalent). Add a safe explicit “local mode” switch.

#### C2 — Wallet password protection not implemented (false sense of security)
- Files: `src/core/WalletManager.ts`, `src/api/wallets.ts`, `frontend/src/pages/WalletsPage.tsx`, `frontend/src/services/api.ts`.
- Impact: Users may lose funds if they rely on a password that is not actually used for encryption/verification.
- Fix: Implement a real scheme (recommended):
  - Derive a key from the user password (Argon2id or scrypt) and encrypt the seed with AES-256-GCM.
  - Store only the encrypted seed and a KDF salt/params; never store plaintext.
  - Provide a migration plan for existing wallets.

### High

#### H1 — WebSocket previously allowed any origin + leaked sensitive config (fixed)
- File: `src/websocket/index.ts`
- Impact: Cross-origin webpages could connect and read node data, potentially including secrets.
- Status: fixed (see “Changes applied”).

#### H2 — API auth middleware had fail-open behavior on unknown mode (fixed)
- File: `src/middleware/apiAuth.ts`
- Status: fixed.

#### H3 — CSP allowed `unsafe-eval` in production (fixed)
- File: `src/server.ts`
- Status: fixed.

### Medium

#### M1 — JWT-like token is custom (no standard claims / rotation)
- File: `src/utils/auth.ts`
- Impact: Harder to integrate with standard tooling; no issuer/audience; in-memory token revocation does not scale.
- Fix: Use `jsonwebtoken` with robust settings (HS256 with rotation or RS256), add `iss/aud`, and externalize revocation (Redis).

#### M2 — Dual backend implementations (Electron embedded server vs TS backend)
- File: `electron/start-server.js`
- Impact: Security fixes may apply to one server but not the other; behavior diverges (wallet encryption differs).
- Fix: Prefer one backend codepath; if embedded server is required, reuse the TypeScript server build.

### Low

#### L1 — Deprecated security header (`X-XSS-Protection`)
- File: `electron/start-server.js`
- Note: Modern browsers ignore it; CSP is the real control.

## Dependency / supply chain review

Commands executed:
- Root: `npm audit --omit=dev --json`
- Frontend: `npm audit --omit=dev --json`

Result: **0 known vulnerabilities** in production dependencies at audit time (per npm advisory DB).

## Recommended next steps (prioritized)

1) **Make production auth fail-closed**
   - Refuse to run in production without explicit auth configuration.

2) **Fix wallets end-to-end**
   - Align routes (`/seed` vs `/export-seed`), return types (`mnemonic`), and implement real password-based protection.

3) **WebSocket authentication (if ever remotely reachable)**
   - If `API_AUTH_MODE=token|basic` or `ENFORCE_AUTH=true`, require an authenticated Socket.IO handshake and/or session.

4) **Docker risk boundary**
   - Treat Docker access as root-equivalent; document safe deployment patterns and defaults.

---

## Implementation status (this repo)

- Wallet password design (scrypt KDF + AES-256-GCM + legacy migration-on-first-use) is implemented.
- WebSocket auth handshakes are implemented and enforced when `API_AUTH_MODE` is `token` or `basic`.

Frontend note: if you enable API auth, set the matching Vite env vars (see `frontend/.env.example`).
