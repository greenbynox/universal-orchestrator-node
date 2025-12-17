/*
 * Wait for the dev backend TCP port to accept connections.
 *
 * Why: avoids noisy Vite proxy ECONNREFUSED spam + flaky Socket.IO handshake
 * during startup when the backend is still compiling/booting.
 *
 * Config:
 *   VITE_BACKEND_HOST (default 127.0.0.1)
 *   VITE_BACKEND_PORT or PORT (default 3001)
 *   WAIT_FOR_BACKEND_TIMEOUT_MS (default 30000)
 */

const net = require('net');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseIntOr(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

async function main() {
  const host = process.env.VITE_BACKEND_HOST || '127.0.0.1';
  const port = parseIntOr(process.env.VITE_BACKEND_PORT ?? process.env.PORT, 3001);
  const timeoutMs = parseIntOr(process.env.WAIT_FOR_BACKEND_TIMEOUT_MS, 30_000);

  const deadline = Date.now() + timeoutMs;

  // Keep output minimal: only print on timeout.
  while (Date.now() < deadline) {
    const ok = await new Promise((resolve) => {
      const socket = new net.Socket();

      const cleanup = () => {
        socket.removeAllListeners();
        try { socket.destroy(); } catch {}
      };

      socket.setTimeout(1000);

      socket.once('connect', () => {
        cleanup();
        resolve(true);
      });

      socket.once('timeout', () => {
        cleanup();
        resolve(false);
      });

      socket.once('error', () => {
        cleanup();
        resolve(false);
      });

      try {
        socket.connect(port, host);
      } catch {
        cleanup();
        resolve(false);
      }
    });

    if (ok) process.exit(0);
    await sleep(250);
  }

  // eslint-disable-next-line no-console
  console.error(`[wait-for-backend] Timeout after ${timeoutMs}ms waiting for ${host}:${port}`);
  process.exit(1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[wait-for-backend] Failed:', err && err.message ? err.message : String(err));
  process.exit(1);
});
