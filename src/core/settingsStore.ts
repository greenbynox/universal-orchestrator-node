import fs from 'fs';
import path from 'path';

import { config } from '../config';
import { logger } from '../utils/logger';

export type RuntimeSettings = {
  // Docker / infra
  dockerAutoStart?: boolean;
  skipDockerCheck?: boolean;
  dockerMaxRetries?: number;
  dockerRetryDelayMs?: number;

  // Nodes
  nodeMaxConcurrent?: number;
  nodeAutoRestart?: boolean;
  nodeStartTimeoutMs?: number;

  // Alerts / health
  alertCpuThreshold?: number;
  alertRamThreshold?: number;
  alertDiskThresholdGB?: number;
  healthcheckIntervalSeconds?: number;
  alertMinSeverity?: 'info' | 'warning' | 'critical';

  // API / security
  apiRateLimitEnabled?: boolean;
  apiAuthMode?: 'none' | 'basic' | 'token';
  apiToken?: string;
  apiBasicUser?: string;
  apiBasicPass?: string;
  allowedOrigins?: string;

  // Integrations
  discordWebhookUrl?: string;
  telegramBotToken?: string;
  telegramChatId?: string;

  // Logs
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logToFile?: boolean;
  logFilePath?: string;
};

const SETTINGS_FILE = path.join(config.paths.data, 'settings.json');

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function safeParseNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function safeParseBoolean(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    if (s === 'true') return true;
    if (s === 'false') return false;
  }
  return undefined;
}

function normalizeSeverity(v: unknown): RuntimeSettings['alertMinSeverity'] {
  if (v === 'info' || v === 'warning' || v === 'critical') return v;
  return undefined;
}

function normalizeAuthMode(v: unknown): RuntimeSettings['apiAuthMode'] {
  if (v === 'none' || v === 'basic' || v === 'token') return v;
  return undefined;
}

function normalizeLogLevel(v: unknown): RuntimeSettings['logLevel'] {
  if (v === 'debug' || v === 'info' || v === 'warn' || v === 'error') return v;
  return undefined;
}

function cleanString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  return v;
}

export function loadSettingsFromDisk(): RuntimeSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return {};
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) return {};

    const s: RuntimeSettings = {
      dockerAutoStart: safeParseBoolean(parsed.dockerAutoStart),
      skipDockerCheck: safeParseBoolean(parsed.skipDockerCheck),
      dockerMaxRetries: safeParseNumber(parsed.dockerMaxRetries),
      dockerRetryDelayMs: safeParseNumber(parsed.dockerRetryDelayMs),

      nodeMaxConcurrent: safeParseNumber(parsed.nodeMaxConcurrent),
      nodeAutoRestart: safeParseBoolean(parsed.nodeAutoRestart),
      nodeStartTimeoutMs: safeParseNumber(parsed.nodeStartTimeoutMs),

      alertCpuThreshold: safeParseNumber(parsed.alertCpuThreshold),
      alertRamThreshold: safeParseNumber(parsed.alertRamThreshold),
      alertDiskThresholdGB: safeParseNumber(parsed.alertDiskThresholdGB),
      healthcheckIntervalSeconds: safeParseNumber(parsed.healthcheckIntervalSeconds),
      alertMinSeverity: normalizeSeverity(parsed.alertMinSeverity),

      apiRateLimitEnabled: safeParseBoolean(parsed.apiRateLimitEnabled),
      apiAuthMode: normalizeAuthMode(parsed.apiAuthMode),
      apiToken: cleanString(parsed.apiToken),
      apiBasicUser: cleanString(parsed.apiBasicUser),
      apiBasicPass: cleanString(parsed.apiBasicPass),
      allowedOrigins: cleanString(parsed.allowedOrigins),

      discordWebhookUrl: cleanString(parsed.discordWebhookUrl),
      telegramBotToken: cleanString(parsed.telegramBotToken),
      telegramChatId: cleanString(parsed.telegramChatId),

      logLevel: normalizeLogLevel(parsed.logLevel),
      logToFile: safeParseBoolean(parsed.logToFile),
      logFilePath: cleanString(parsed.logFilePath),
    };

    // Remove undefined keys to avoid accidental overrides
    Object.keys(s).forEach((k) => {
      const key = k as keyof RuntimeSettings;
      if (typeof s[key] === 'undefined') delete s[key];
    });

    // Dev safety: avoid persisting an auth mode that cannot work (would brick the API UX)
    if (config.isDev) {
      if (s.apiAuthMode === 'token') {
        const token = String(s.apiToken ?? process.env.API_TOKEN ?? '').trim();
        if (!token) {
          logger.warn('settings.json has apiAuthMode=token but no apiToken; downgrading to none for dev safety');
          s.apiAuthMode = 'none';
        }
      }
      if (s.apiAuthMode === 'basic') {
        const user = String(s.apiBasicUser ?? process.env.API_BASIC_USER ?? '').trim();
        const pass = String(s.apiBasicPass ?? process.env.API_BASIC_PASS ?? '').trim();
        if (!user || !pass) {
          logger.warn('settings.json has apiAuthMode=basic but missing apiBasicUser/apiBasicPass; downgrading to none for dev safety');
          s.apiAuthMode = 'none';
        }
      }
    }

    return s;
  } catch (err) {
    logger.warn('Failed to load settings.json, ignoring', { error: (err as Error).message });
    return {};
  }
}

export function saveSettingsToDisk(settings: RuntimeSettings): void {
  try {
    fs.mkdirSync(config.paths.data, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (err) {
    logger.error('Failed to save settings.json', { error: (err as Error).message });
    throw err;
  }
}

export function getCurrentRuntimeSettings(): RuntimeSettings {
  // Source of truth is config + env (already merged at boot). Expose the UI-shaped view.
  return {
    dockerAutoStart: config.docker.autoStart,
    skipDockerCheck: process.env.SKIP_DOCKER_CHECK === 'true',
    dockerMaxRetries: config.docker.maxRetries,
    dockerRetryDelayMs: config.docker.retryDelayMs,

    nodeMaxConcurrent: config.node.maxConcurrent,
    nodeAutoRestart: config.node.autoRestart,
    nodeStartTimeoutMs: config.node.startTimeoutMs,

    alertCpuThreshold: config.alerts.cpuThreshold,
    alertRamThreshold: config.alerts.ramThreshold,
    alertDiskThresholdGB: config.alerts.diskThresholdGB,
    healthcheckIntervalSeconds: config.alerts.healthcheckIntervalSeconds,
    alertMinSeverity: (config.alerts.minSeverity || 'warning') as RuntimeSettings['alertMinSeverity'],

    apiRateLimitEnabled: config.api.rateLimitEnabled,
    apiAuthMode: (config.api.authMode || 'none') as RuntimeSettings['apiAuthMode'],
    apiToken: process.env.API_TOKEN || '',
    apiBasicUser: process.env.API_BASIC_USER || '',
    apiBasicPass: process.env.API_BASIC_PASS || '',
    allowedOrigins: (config.api.allowedOrigins || []).join(','),

    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',

    logLevel: (process.env.LOG_LEVEL as RuntimeSettings['logLevel']) || (config.isDev ? 'debug' : 'info'),
    logToFile: process.env.LOG_TO_FILE ? process.env.LOG_TO_FILE === 'true' : true,
    logFilePath: process.env.LOG_FILE_PATH || '',
  };
}

export function applyRuntimeSettings(partial: RuntimeSettings): void {
  // Apply to process.env (so modules that read env dynamically can react)
  if (typeof partial.skipDockerCheck === 'boolean') {
    process.env.SKIP_DOCKER_CHECK = partial.skipDockerCheck ? 'true' : 'false';
  }

  if (typeof partial.dockerAutoStart === 'boolean') {
    process.env.DOCKER_AUTO_START = partial.dockerAutoStart ? 'true' : 'false';
    config.docker.autoStart = partial.dockerAutoStart;
  }

  if (typeof partial.dockerMaxRetries === 'number') {
    process.env.DOCKER_MAX_RETRIES = String(partial.dockerMaxRetries);
    config.docker.maxRetries = Math.max(1, Math.floor(partial.dockerMaxRetries));
  }

  if (typeof partial.dockerRetryDelayMs === 'number') {
    process.env.DOCKER_RETRY_DELAY_MS = String(partial.dockerRetryDelayMs);
    config.docker.retryDelayMs = Math.max(0, Math.floor(partial.dockerRetryDelayMs));
  }

  if (typeof partial.nodeMaxConcurrent === 'number') {
    process.env.NODE_MAX_CONCURRENT = String(partial.nodeMaxConcurrent);
    config.node.maxConcurrent = Math.max(1, Math.floor(partial.nodeMaxConcurrent));
  }

  if (typeof partial.nodeAutoRestart === 'boolean') {
    process.env.NODE_AUTO_RESTART = partial.nodeAutoRestart ? 'true' : 'false';
    config.node.autoRestart = partial.nodeAutoRestart;
  }

  if (typeof partial.nodeStartTimeoutMs === 'number') {
    process.env.NODE_START_TIMEOUT_MS = String(partial.nodeStartTimeoutMs);
    config.node.startTimeoutMs = Math.max(1000, Math.floor(partial.nodeStartTimeoutMs));
  }

  if (typeof partial.alertCpuThreshold === 'number') {
    process.env.ALERT_CPU_THRESHOLD = String(partial.alertCpuThreshold);
    config.alerts.cpuThreshold = Math.max(0, Math.min(100, Math.floor(partial.alertCpuThreshold)));
  }

  if (typeof partial.alertRamThreshold === 'number') {
    process.env.ALERT_RAM_THRESHOLD = String(partial.alertRamThreshold);
    config.alerts.ramThreshold = Math.max(0, Math.min(100, Math.floor(partial.alertRamThreshold)));
  }

  if (typeof partial.alertDiskThresholdGB === 'number') {
    process.env.ALERT_DISK_THRESHOLD_GB = String(partial.alertDiskThresholdGB);
    config.alerts.diskThresholdGB = Math.max(0, Math.floor(partial.alertDiskThresholdGB));
  }

  if (typeof partial.healthcheckIntervalSeconds === 'number') {
    process.env.HEALTHCHECK_INTERVAL_SECONDS = String(partial.healthcheckIntervalSeconds);
    config.alerts.healthcheckIntervalSeconds = Math.max(5, Math.floor(partial.healthcheckIntervalSeconds));
  }

  if (partial.alertMinSeverity) {
    process.env.ALERT_MIN_SEVERITY = partial.alertMinSeverity;
    config.alerts.minSeverity = partial.alertMinSeverity;
  }

  if (typeof partial.apiRateLimitEnabled === 'boolean') {
    process.env.API_RATE_LIMIT_ENABLED = partial.apiRateLimitEnabled ? 'true' : 'false';
    config.api.rateLimitEnabled = partial.apiRateLimitEnabled;
  }

  if (partial.apiAuthMode) {
    process.env.API_AUTH_MODE = partial.apiAuthMode;
    config.api.authMode = partial.apiAuthMode;
  }

  if (typeof partial.apiToken === 'string') {
    process.env.API_TOKEN = partial.apiToken;
    config.api.apiToken = partial.apiToken;
  }

  if (typeof partial.apiBasicUser === 'string') {
    process.env.API_BASIC_USER = partial.apiBasicUser;
    config.api.basicUser = partial.apiBasicUser;
  }

  if (typeof partial.apiBasicPass === 'string') {
    process.env.API_BASIC_PASS = partial.apiBasicPass;
    config.api.basicPass = partial.apiBasicPass;
  }

  if (typeof partial.allowedOrigins === 'string') {
    process.env.ALLOWED_ORIGINS = partial.allowedOrigins;
    config.api.allowedOrigins = partial.allowedOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  if (typeof partial.discordWebhookUrl === 'string') {
    process.env.DISCORD_WEBHOOK_URL = partial.discordWebhookUrl;
  }
  if (typeof partial.telegramBotToken === 'string') {
    process.env.TELEGRAM_BOT_TOKEN = partial.telegramBotToken;
  }
  if (typeof partial.telegramChatId === 'string') {
    process.env.TELEGRAM_CHAT_ID = partial.telegramChatId;
  }

  if (partial.logLevel) {
    process.env.LOG_LEVEL = partial.logLevel;
  }
  if (typeof partial.logToFile === 'boolean') {
    process.env.LOG_TO_FILE = partial.logToFile ? 'true' : 'false';
  }
  if (typeof partial.logFilePath === 'string') {
    process.env.LOG_FILE_PATH = partial.logFilePath;
  }
}
