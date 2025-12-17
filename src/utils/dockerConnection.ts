import type Docker from 'dockerode';

export type DockerConnectionAttempt = {
  label: string;
  opts: Docker.DockerOptions;
  kind: 'socket' | 'tcp';
};

function normalizeSocketPath(value: string): string {
  if (value.startsWith('unix://')) return value.slice('unix://'.length);
  if (value.startsWith('npipe://')) return value.replace(/^npipe:\/\//, '');
  return value;
}

function parseLoopbackTcpDockerHost(dockerHost: string): { host: string; port: number } | null {
  if (!dockerHost.startsWith('tcp://')) return null;
  try {
    const url = new URL(dockerHost);
    const host = url.hostname;
    const port = url.port ? Number(url.port) : 2375;
    if (!Number.isFinite(port) || port <= 0) return null;

    // Security: only allow loopback TCP.
    const loopbacks = new Set(['localhost', '127.0.0.1', '::1']);
    if (!loopbacks.has(host)) {
      // Special case for Windows+WSL2: allow the WSL VM IP, but only when explicitly
      // provided via WSL_DOCKER_IP (set by scripts/dev.ps1).
      const wslIp = (process.env.WSL_DOCKER_IP || '').trim();
      if (!wslIp || host !== wslIp) return null;

      // Only allow private RFC1918 IPv4 ranges.
      const parts = host.split('.').map(n => Number(n));
      if (parts.length !== 4 || parts.some(n => !Number.isFinite(n) || n < 0 || n > 255)) return null;
      const [a, b] = parts;
      const isPrivate = a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
      if (!isPrivate) return null;
    }

    return { host, port };
  } catch {
    // Support tcp://host:port without strict URL parsing edge cases
    const m = dockerHost.match(/^tcp:\/\/([^:/]+)(?::(\d+))?\/?$/);
    if (!m) return null;
    const host = m[1];
    const port = m[2] ? Number(m[2]) : 2375;
    const loopbacks = new Set(['localhost', '127.0.0.1', '::1']);
    if (!loopbacks.has(host)) {
      const wslIp = (process.env.WSL_DOCKER_IP || '').trim();
      if (!wslIp || host !== wslIp) return null;
      const parts = host.split('.').map(n => Number(n));
      if (parts.length !== 4 || parts.some(n => !Number.isFinite(n) || n < 0 || n > 255)) return null;
      const [a, b] = parts;
      const isPrivate = a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
      if (!isPrivate) return null;
    }
    if (!Number.isFinite(port) || port <= 0) return null;
    return { host, port };
  }
}

function uniqByLabel(attempts: DockerConnectionAttempt[]): DockerConnectionAttempt[] {
  const seen = new Set<string>();
  const out: DockerConnectionAttempt[] = [];
  for (const a of attempts) {
    if (seen.has(a.label)) continue;
    seen.add(a.label);
    out.push(a);
  }
  return out;
}

/**
 * Returns ordered connection attempts.
 *
 * Security policy:
 * - tcp:// is refused unless it is loopback (localhost/127.0.0.1/::1).
 */
export function getDockerConnectionAttempts(): DockerConnectionAttempt[] {
  const attempts: DockerConnectionAttempt[] = [];

  const wslIp = (process.env.WSL_DOCKER_IP || '').trim();
  const dockerHostEnv = (process.env.DOCKER_HOST || '').trim();
  const preferWslTcp = process.platform === 'win32' && !!wslIp && !!dockerHostEnv && !!parseLoopbackTcpDockerHost(dockerHostEnv);

  // In WSL2 mode, prefer TCP first even if DOCKER_SOCKET is set in .env.
  if (preferWslTcp) {
    const tcp = parseLoopbackTcpDockerHost(dockerHostEnv);
    if (tcp) {
      attempts.push({
        kind: 'tcp',
        label: `tcp://${tcp.host}:${tcp.port}`,
        opts: { host: tcp.host, port: tcp.port, protocol: 'http' },
      });
    }
  }

  const dockerSocket = process.env.DOCKER_SOCKET;
  if (dockerSocket && !preferWslTcp) {
    const socketPath = normalizeSocketPath(dockerSocket);
    attempts.push({
      kind: 'socket',
      label: `socket:${socketPath}`,
      opts: { socketPath },
    });
  }

  const dockerHost = process.env.DOCKER_HOST;
  if (dockerHost && !preferWslTcp) {
    const tcp = parseLoopbackTcpDockerHost(dockerHost);
    if (tcp) {
      attempts.push({
        kind: 'tcp',
        label: `tcp://${tcp.host}:${tcp.port}`,
        opts: { host: tcp.host, port: tcp.port, protocol: 'http' },
      });
    } else if (!dockerHost.startsWith('tcp://')) {
      const socketPath = normalizeSocketPath(dockerHost);
      attempts.push({
        kind: 'socket',
        label: `socket:${socketPath}`,
        opts: { socketPath },
      });
    }
  }

  // Defaults
  if (process.platform === 'win32') {
    attempts.push({
      kind: 'socket',
      label: 'npipe://./pipe/docker_engine',
      opts: { socketPath: '//./pipe/docker_engine' },
    });
    attempts.push({
      kind: 'socket',
      label: 'npipe://./pipe/dockerDesktopLinuxEngine',
      opts: { socketPath: '//./pipe/dockerDesktopLinuxEngine' },
    });

    // Optional default for WSL2 Docker Engine when exposed locally.
    // This does NOT enable remote TCP.
    attempts.push({
      kind: 'tcp',
      label: 'tcp://127.0.0.1:2375',
      opts: { host: '127.0.0.1', port: 2375, protocol: 'http' },
    });
  } else {
    attempts.push({
      kind: 'socket',
      label: 'unix:///var/run/docker.sock',
      opts: { socketPath: '/var/run/docker.sock' },
    });
  }

  return uniqByLabel(attempts);
}

export function getPreferredDockerConnection(): DockerConnectionAttempt {
  return getDockerConnectionAttempts()[0];
}
