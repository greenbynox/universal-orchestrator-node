import fs from 'fs';
import path from 'path';

import type { NodeConfig } from '../types';
import type { NodeTemplate } from '../core/TemplateManager';

type ParsedBindSpec = {
  host: string;
  container: string;
  mode?: string;
};

function parseBindSpec(spec: string): ParsedBindSpec | null {
  const s = (spec || '').trim();
  if (!s) return null;

  // We expect: <host>:<container>[:<mode>]
  // Container paths in Linux start with '/'. We use the first occurrence of ':/'
  // (drive letter `C:\` won't match because it is ':\', not ':/').
  const containerIdx = s.indexOf(':/');
  if (containerIdx <= 0) return null;

  const host = s.slice(0, containerIdx);
  const rest = s.slice(containerIdx + 1); // starts with '/'

  // Optional mode at the end.
  const lastColon = rest.lastIndexOf(':');
  if (lastColon > 0) {
    const maybeMode = rest.slice(lastColon + 1);
    const container = rest.slice(0, lastColon);
    if (maybeMode && !maybeMode.includes('/') && !maybeMode.includes('\\')) {
      return { host, container, mode: maybeMode };
    }
  }

  return { host, container: rest };
}

function normalizeHostPathForDocker(hostPath: string, platform: string): string {
  const hp = hostPath.trim();

  const isWslDockerTarget = (): boolean => {
    // When the backend runs on Windows but targets a Docker Engine inside WSL2 (Linux daemon),
    // bind mount sources must be Linux paths (e.g. /mnt/c/Users/...).
    const wslIp = (process.env.WSL_DOCKER_IP || '').trim();
    if (!wslIp) return false;

    const dockerHost = (process.env.DOCKER_HOST || '').trim();
    if (!dockerHost.startsWith('tcp://')) return false;

    try {
      const url = new URL(dockerHost);
      return url.hostname === wslIp;
    } catch {
      return dockerHost.includes(wslIp);
    }
  };

  const windowsDriveToWsl = (p: string): string | null => {
    // Accept: C:\path\to\dir OR C:/path/to/dir
    const m = p.match(/^([A-Za-z]):[\\/](.*)$/);
    if (!m) return null;
    const drive = m[1].toLowerCase();
    const rest = m[2].replace(/\\/g, '/');
    // Keep spaces and other characters as-is.
    return `/mnt/${drive}/${rest}`.replace(/\/+/g, '/');
  };

  // For Windows Docker (named pipe / Desktop), forward slashes are typically safest.
  if (platform === 'win32') {
    // Keep UNC paths as-is.
    if (hp.startsWith('\\\\')) return hp;

    // If targeting WSL2 Docker Engine (Linux daemon), translate Windows drive paths.
    if (isWslDockerTarget()) {
      const converted = windowsDriveToWsl(hp);
      if (converted) return converted;
    }

    return hp.replace(/\\/g, '/');
  }

  return hp;
}

function substituteDataPlaceholder(hostPart: string, dataDir: string): string | null {
  // Templates may use "/data" as a placeholder for the host data directory.
  // Example: "/data:/data" -> "<node.dataPath>:/data"
  const host = hostPart.trim();
  if (!host) return null;

  if (host === '/data') return dataDir;
  if (host.startsWith('/data/')) {
    const rel = host.slice('/data/'.length);
    return path.join(dataDir, rel);
  }

  // Unknown host mapping - reject by default (security: avoid mounting arbitrary host paths from templates).
  return null;
}

/**
 * Build Docker bind mounts for a node.
 *
 * Security note: we only allow template host mounts that use the "/data" placeholder.
 */
export function buildNodeBinds(nodeConfig: NodeConfig, template?: NodeTemplate, platform: string = process.platform): string[] {
  const dataDir = path.resolve(nodeConfig.dataPath);
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch {
    // ignore
  }

  const templateVolumes = template?.docker?.volumes || [];
  const binds: string[] = [];

  for (const rawSpec of templateVolumes) {
    if (typeof rawSpec !== 'string') continue;

    const parsed = parseBindSpec(rawSpec);
    if (!parsed) continue;

    const substitutedHost = substituteDataPlaceholder(parsed.host, dataDir);
    if (!substitutedHost) continue;

    const hostNormalized = normalizeHostPathForDocker(substitutedHost, platform);
    const container = parsed.container.trim();
    if (!container.startsWith('/')) continue;

    const full = parsed.mode
      ? `${hostNormalized}:${container}:${parsed.mode}`
      : `${hostNormalized}:${container}`;

    binds.push(full);
  }

  // If the template didn't define any valid bind mounts, provide a safe default.
  if (binds.length === 0) {
    binds.push(`${normalizeHostPathForDocker(dataDir, platform)}:/data`);
  }

  // De-duplicate while preserving order.
  return Array.from(new Set(binds));
}
