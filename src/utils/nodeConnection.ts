import type { NodeConfig } from '../types';

export interface NodeRpcAuth {
  username: string;
  password: string;
}

export interface NodeConnectionInfo {
  rpcUrl: string;
  wsUrl?: string;
  p2pPort: number;
  localOnly: boolean;
  // Optional: some chains need auth (e.g. Bitcoin)
  rpcAuth?: NodeRpcAuth;
}

export type RpcProbe = {
  url: string;
  method: 'POST';
  data: any;
  headers?: Record<string, string>;
  auth?: NodeRpcAuth;
};

function isLoopbackHost(host: string): boolean {
  const h = host.trim().toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

function isPrivateIPv4(host: string): boolean {
  const parts = host.split('.').map(n => Number(n));
  if (parts.length !== 4 || parts.some(n => !Number.isFinite(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

function parseTcpDockerHost(host: string): { host: string; port: number } | null {
  if (!host || !host.startsWith('tcp://')) return null;
  try {
    const url = new URL(host);
    const port = url.port ? Number(url.port) : 2375;
    if (!Number.isFinite(port) || port <= 0) return null;
    return { host: url.hostname, port };
  } catch {
    const m = host.match(/^tcp:\/\/([^:/]+)(?::(\d+))?\/?$/);
    if (!m) return null;
    const h = m[1];
    const port = m[2] ? Number(m[2]) : 2375;
    if (!Number.isFinite(port) || port <= 0) return null;
    return { host: h, port };
  }
}

export type LocalHostSelection = { host: string; localOnly: boolean };

/**
 * Host to use when connecting to node RPC/WS from this app.
 *
 * Why not always 127.0.0.1?
 * - On Windows when Docker Engine runs inside WSL2, Docker port publishing happens
 *   on the WSL VM network stack. Binding to 127.0.0.1 inside WSL is NOT reachable
 *   from Windows. In that case we use the WSL VM IP for both binding and access.
 */
export function getLocalHostSelection(): LocalHostSelection {
  // Explicit override (advanced). Keep it constrained to loopback/private networks.
  const override = (process.env.NODE_RPC_HOST || '').trim();
  if (override) {
    if (isLoopbackHost(override) || isPrivateIPv4(override)) {
      return { host: override, localOnly: isLoopbackHost(override) };
    }
  }

  // WSL2 Docker Engine (typically Windows host): use the WSL VM IP if DOCKER_HOST targets it.
  // We keep this check platform-agnostic so tests and custom setups behave deterministically.
  const dockerHost = (process.env.DOCKER_HOST || '').trim();
  const tcp = parseTcpDockerHost(dockerHost);
  const wslIp = (process.env.WSL_DOCKER_IP || '').trim();
  if (tcp && wslIp && tcp.host === wslIp && isPrivateIPv4(tcp.host)) {
    return { host: tcp.host, localOnly: false };
  }

  // Default: localhost.
  return { host: '127.0.0.1', localOnly: true };
}

export function getLocalHost(): string {
  // Backward compatible helper used throughout the code.
  return getLocalHostSelection().host;
}

/**
 * IP to bind Docker-published node ports to.
 * - Returns an IPv4 address suitable for Docker PortBindings.HostIp.
 */
export function getDockerPublishedHostIp(): string {
  const sel = getLocalHostSelection();
  const h = sel.host.trim();
  if (h.toLowerCase() === 'localhost') return '127.0.0.1';
  // Docker expects an IP, not a hostname.
  if (isPrivateIPv4(h) || h === '127.0.0.1') return h;
  return '127.0.0.1';
}

export function getRpcAuthFromCustomConfig(customConfig: NodeConfig['customConfig']): NodeRpcAuth | undefined {
  const cfg: any = customConfig;
  const auth = cfg?.rpcAuth ?? cfg?.rpc?.auth;
  if (!auth) return undefined;
  const username = auth.username;
  const password = auth.password;
  if (typeof username === 'string' && username.length > 0 && typeof password === 'string' && password.length > 0) {
    return { username, password };
  }
  return undefined;
}

export function computeLocalConnectionInfo(nodeConfig: NodeConfig): NodeConnectionInfo {
  const { host, localOnly } = getLocalHostSelection();
  const rpcUrl = `http://${host}:${nodeConfig.rpcPort}`;
  const wsUrl = typeof nodeConfig.wsPort === 'number' ? `ws://${host}:${nodeConfig.wsPort}` : undefined;

  return {
    rpcUrl,
    wsUrl,
    p2pPort: nodeConfig.p2pPort,
    localOnly,
    rpcAuth: getRpcAuthFromCustomConfig(nodeConfig.customConfig),
  };
}

export function buildRpcProbe(nodeConfig: NodeConfig): RpcProbe {
  const { rpcUrl, rpcAuth } = computeLocalConnectionInfo(nodeConfig);

  switch (nodeConfig.blockchain) {
    case 'bitcoin':
      return {
        url: rpcUrl,
        method: 'POST',
        auth: rpcAuth,
        headers: { 'Content-Type': 'application/json' },
        data: { jsonrpc: '1.0', id: 'orchestrator', method: 'getblockchaininfo', params: [] },
      };

    case 'ethereum':
    case 'bnb':
      return {
        url: rpcUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { jsonrpc: '2.0', id: 1, method: 'web3_clientVersion', params: [] },
      };

    case 'solana':
      return {
        url: rpcUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { jsonrpc: '2.0', id: 1, method: 'getHealth', params: [] },
      };

    case 'monero':
      return {
        url: `${rpcUrl}/json_rpc`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { jsonrpc: '2.0', id: '0', method: 'get_info', params: {} },
      };

    default:
      return {
        url: rpcUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { jsonrpc: '2.0', id: 1, method: 'web3_clientVersion', params: [] },
      };
  }
}
