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
    // Fichier pour tous les logs
    new winston.transports.File({
      filename: path.join(config.paths.logs, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // Fichier séparé pour les erreurs
    new winston.transports.File({
      filename: path.join(config.paths.logs, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

// Ajouter la console en développement
if (config.isDev) {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

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
