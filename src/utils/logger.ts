/**
 * ============================================================
 * NODE ORCHESTRATOR - Logger Utility
 * ============================================================
 * Système de logging centralisé avec Winston
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

// Créer le dossier de logs s'il n'existe pas
if (!fs.existsSync(config.paths.logs)) {
  fs.mkdirSync(config.paths.logs, { recursive: true });
}

// Format personnalisé pour les logs
const SENSITIVE_KEYS = ['password', 'secret', 'token', 'key', 'mnemonic', 'seed', 'passphrase', 'private'];
const IPV4_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const HEX_REGEX = /\b[0-9a-fA-F]{32,}\b/g;

const redactString = (value: string): string => {
  return value
    .replace(IPV4_REGEX, '[REDACTED_IP]')
    .replace(HEX_REGEX, '[REDACTED]');
};

const redactValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(s => lowerKey.includes(s))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactValue(val);
      }
    }
    return result;
  }
  return value;
};

const redactionFormat = winston.format((info) => {
  const scrubbed = { ...info } as winston.Logform.TransformableInfo;
  scrubbed.message = redactString(String(info.message ?? ''));

  const meta = { ...info } as Record<string, unknown>;
  delete meta.level;
  delete meta.message;
  delete meta.timestamp;
  delete meta.nodeId;

  for (const [key, value] of Object.entries(meta)) {
    scrubbed[key] = redactValue(value);
  }

  return scrubbed;
});

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  redactionFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { level, message, timestamp, nodeId, ...meta } = info;
    const nodePrefix = nodeId ? `[${nodeId}] ` : '';
    const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${nodePrefix}${message}${metaStr}`;
  })
);

// Format coloré pour la console
const consoleFormat = winston.format.combine(
  redactionFormat(),
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info) => {
    const { level, message, timestamp, nodeId } = info;
    const nodePrefix = nodeId ? `[${nodeId}] ` : '';
    return `${timestamp} ${level} ${nodePrefix}${message}`;
  })
);

// Logger principal
export const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: customFormat,
  defaultMeta: { service: 'node-orchestrator' },
  transports: [
    // File transports are configured by applyLoggingFromEnv() below.
  ],
});

// Ajouter la console en développement
if (config.isDev) {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

/**
 * Apply logging config from environment variables.
 * - LOG_LEVEL: debug|info|warn|error
 * - LOG_TO_FILE: true|false (default true)
 * - LOG_FILE_PATH: custom combined log path (optional)
 */
export function applyLoggingFromEnv(): void {
  const level = (process.env.LOG_LEVEL || (config.isDev ? 'debug' : 'info')).toLowerCase();
  if (['debug', 'info', 'warn', 'error'].includes(level)) {
    logger.level = level;
  }

  const logToFile = process.env.LOG_TO_FILE ? process.env.LOG_TO_FILE === 'true' : true;

  // Remove all existing file transports (best-effort)
  for (const t of [...logger.transports]) {
    // winston v3: File transport has a `filename` property
    const anyT = t as any;
    if (anyT?.filename && (t as any)?.constructor?.name === 'File') {
      logger.remove(t);
    }
  }

  if (!logToFile) {
    return;
  }

  const configuredPath = process.env.LOG_FILE_PATH;
  const combinedPath = (() => {
    if (!configuredPath) return path.join(config.paths.logs, 'combined.log');
    const resolved = path.resolve(configuredPath);
    return resolved.toLowerCase().endsWith('.log') ? resolved : `${resolved}.log`;
  })();

  const errorPath = (() => {
    if (!configuredPath) return path.join(config.paths.logs, 'error.log');
    const base = combinedPath.toLowerCase().endsWith('.log') ? combinedPath.slice(0, -4) : combinedPath;
    return `${base}.error.log`;
  })();

  try {
    fs.mkdirSync(path.dirname(combinedPath), { recursive: true });
  } catch {
    // ignore
  }

  logger.add(new winston.transports.File({
    filename: combinedPath,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 5,
  }));

  logger.add(new winston.transports.File({
    filename: errorPath,
    level: 'error',
    maxsize: 10 * 1024 * 1024,
    maxFiles: 5,
  }));
}

// Apply env config on startup
applyLoggingFromEnv();

// ============================================================
// LOGGER SPÉCIFIQUE PAR NODE
// ============================================================

const nodeLoggers: Map<string, winston.Logger> = new Map();

/**
 * Obtenir un logger spécifique pour un node
 */
export function getNodeLogger(nodeId: string): winston.Logger {
  if (nodeLoggers.has(nodeId)) {
    return nodeLoggers.get(nodeId)!;
  }

  const nodeLogPath = path.join(config.paths.logs, 'nodes');
  if (!fs.existsSync(nodeLogPath)) {
    fs.mkdirSync(nodeLogPath, { recursive: true });
  }

  const nodeLogger = winston.createLogger({
    level: config.isDev ? 'debug' : 'info',
    format: customFormat,
    defaultMeta: { nodeId },
    transports: [
      new winston.transports.File({
        filename: path.join(nodeLogPath, `${nodeId}.log`),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 3,
      }),
    ],
  });

  if (config.isDev) {
    nodeLogger.add(new winston.transports.Console({
      format: consoleFormat,
    }));
  }

  nodeLoggers.set(nodeId, nodeLogger);
  return nodeLogger;
}

/**
 * Supprimer le logger d'un node
 */
export function removeNodeLogger(nodeId: string): void {
  const nodeLogger = nodeLoggers.get(nodeId);
  if (nodeLogger) {
    nodeLogger.close();
    nodeLoggers.delete(nodeId);
  }
}

/**
 * Obtenir les derniers logs d'un node
 */
export async function getNodeLogs(
  nodeId: string, 
  lines: number = 100
): Promise<string[]> {
  const logFile = path.join(config.paths.logs, 'nodes', `${nodeId}.log`);
  
  if (!fs.existsSync(logFile)) {
    return [];
  }

  return new Promise((resolve, reject) => {
    fs.readFile(logFile, 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
      if (err) {
        reject(err);
        return;
      }
      const allLines = data.trim().split('\n');
      resolve(allLines.slice(-lines));
    });
  });
}

export default logger;
