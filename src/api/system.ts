/**
 * ============================================================
 * NODE ORCHESTRATOR - System API Routes
 * ============================================================
 * Routes API pour les informations système
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getSystemResources, getCurrentMetrics, getAllRecommendations } from '../utils/system';
import { performSystemCheck } from '../core/systemCheck';
import { BLOCKCHAIN_CONFIGS } from '../config';
import { requireAuth } from '../utils/auth';
import { applyRuntimeSettings, getCurrentRuntimeSettings, loadSettingsFromDisk, saveSettingsToDisk, RuntimeSettings } from '../core/settingsStore';
import { nodeManager } from '../core/NodeManager';
import { applyLoggingFromEnv } from '../utils/logger';

function validateApiAuthSettings(next: RuntimeSettings): { ok: true } | { ok: false; error: string } {
  const mode = ((next.apiAuthMode ?? process.env.API_AUTH_MODE ?? 'none') as string).toLowerCase();

  const token = String(next.apiToken ?? process.env.API_TOKEN ?? '').trim();
  const user = String(next.apiBasicUser ?? process.env.API_BASIC_USER ?? '').trim();
  const pass = String(next.apiBasicPass ?? process.env.API_BASIC_PASS ?? '').trim();

  if (mode === 'token' && !token) {
    return { ok: false, error: 'API auth mode "token" requires an API token (API_TOKEN)' };
  }
  if (mode === 'basic' && (!user || !pass)) {
    return { ok: false, error: 'API auth mode "basic" requires both username and password (API_BASIC_USER/API_BASIC_PASS)' };
  }
  if (mode !== 'none' && mode !== 'token' && mode !== 'basic') {
    return { ok: false, error: `Unknown API auth mode: ${mode}` };
  }
  return { ok: true };
}

const router: RouterType = Router();

// ============================================================
// GET /system/resources - Ressources système
// ============================================================
router.get('/resources', async (_req: Request, res: Response) => {
  try {
    const resources = await getSystemResources();
    
    res.json({
      success: true,
      data: resources,
      timestamp: new Date(),
    });
  } catch (error) {
    const errMsg = (error as Error).message;
    res.status(500).json({
      success: false,
      error: errMsg,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /system/metrics - Métriques en temps réel
// ============================================================
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getCurrentMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /system/blockchains - Liste des blockchains supportées
// ============================================================
router.get('/blockchains', async (_req: Request, res: Response) => {
  try {
    const blockchains = Object.values(BLOCKCHAIN_CONFIGS).map(config => ({
      name: config.name,
      displayName: config.displayName,
      symbol: config.symbol,
      color: config.color,
      icon: config.icon,
      requirements: config.requirements,
    }));
    
    res.json({
      success: true,
      data: blockchains,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /system/recommendations - Toutes les recommandations
// ============================================================
router.get('/recommendations', async (_req: Request, res: Response) => {
  try {
    const recommendations = await getAllRecommendations();
    
    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /system/health - Health check
// ============================================================
router.get('/health', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      version: '2.2.0',
    },
    timestamp: new Date(),
  });
});

// ============================================================
// GET /system/docker-status - Vérifier l'état de Docker
// ============================================================
router.get('/docker-status', async (_req: Request, res: Response) => {
  try {
    const check = await performSystemCheck('bitcoin', 'full');
    const isDev = process.env.NODE_ENV === 'development';
    
    res.json({
      success: true,
      data: {
        dockerAvailable: check.checks.docker.passed,
        dockerMessage: check.checks.docker.message,
        isDevelopment: isDev,
        mode: isDev ? 'development (mock mode enabled if Docker is unavailable)' : 'production',
        allChecksPassed: check.passed,
        checks: {
          docker: check.checks.docker,
          disk: check.checks.disk,
          memory: check.checks.memory,
          cpu: check.checks.cpu,
        },
        errors: check.errors,
        warnings: check.warnings,
        recommendations: check.recommendations,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: {
        dockerAvailable: false,
        dockerMessage: 'Impossible de vérifier Docker',
        isDevelopment: process.env.NODE_ENV === 'development',
        mode: process.env.NODE_ENV === 'development' ? 'development (mock mode enabled)' : 'production',
        error: (error as Error).message,
      },
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /system/status - État général du système
// ============================================================
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const check = await performSystemCheck('bitcoin', 'full');
    const isDev = process.env.NODE_ENV === 'development';
    const isLocalhost = process.env.HOST === '127.0.0.1' || process.env.HOST === 'localhost' || !process.env.HOST;
    
    res.json({
      success: true,
      data: {
        environment: process.env.NODE_ENV,
        isDevelopment: isDev,
        isLocalhost: isLocalhost,
        mode: isDev && isLocalhost ? 'development-localhost' : 'production',
        docker: {
          available: check.checks.docker.passed,
          message: check.checks.docker.message,
          mockEnabled: isDev && isLocalhost && !check.checks.docker.passed,
        },
        resources: {
          disk: check.checks.disk,
          memory: check.checks.memory,
          cpu: check.checks.cpu,
        },
        system: {
          passed: check.passed,
          errors: check.errors,
          warnings: check.warnings,
          recommendations: check.recommendations,
        },
      },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      error: 'Impossible de vérifier l\'état du système',
      details: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// RUNTIME SETTINGS (protected)
// ============================================================

// GET /system/settings - Current + persisted settings (requires auth)
router.get('/settings', requireAuth, (_req: Request, res: Response) => {
  const persisted = loadSettingsFromDisk();
  const current = getCurrentRuntimeSettings();

  res.json({
    success: true,
    data: {
      ...current,
      ...persisted,
    },
    timestamp: new Date(),
  });
});

// PUT /system/settings - Update + persist settings (requires auth)
router.put('/settings', requireAuth, (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;

  // Whitelist keys only
  const partial: RuntimeSettings = {
    dockerAutoStart: body.dockerAutoStart as any,
    skipDockerCheck: body.skipDockerCheck as any,
    dockerMaxRetries: body.dockerMaxRetries as any,
    dockerRetryDelayMs: body.dockerRetryDelayMs as any,

    nodeMaxConcurrent: body.nodeMaxConcurrent as any,
    nodeAutoRestart: body.nodeAutoRestart as any,
    nodeStartTimeoutMs: body.nodeStartTimeoutMs as any,

    alertCpuThreshold: body.alertCpuThreshold as any,
    alertRamThreshold: body.alertRamThreshold as any,
    alertDiskThresholdGB: body.alertDiskThresholdGB as any,
    healthcheckIntervalSeconds: body.healthcheckIntervalSeconds as any,
    alertMinSeverity: body.alertMinSeverity as any,

    apiRateLimitEnabled: body.apiRateLimitEnabled as any,
    apiAuthMode: body.apiAuthMode as any,
    apiToken: body.apiToken as any,
    apiBasicUser: body.apiBasicUser as any,
    apiBasicPass: body.apiBasicPass as any,
    allowedOrigins: body.allowedOrigins as any,

    discordWebhookUrl: body.discordWebhookUrl as any,
    telegramBotToken: body.telegramBotToken as any,
    telegramChatId: body.telegramChatId as any,

    logLevel: body.logLevel as any,
    logToFile: body.logToFile as any,
    logFilePath: body.logFilePath as any,
  };

  // Remove undefined keys
  (Object.keys(partial) as (keyof RuntimeSettings)[]).forEach((k) => {
    if (typeof partial[k] === 'undefined') delete partial[k];
  });

  // Persist first (source of truth), then apply to runtime
  const existing = loadSettingsFromDisk();
  const next = { ...existing, ...partial };

  // Validate auth configuration changes BEFORE persisting/applying
  const validation = validateApiAuthSettings(next);
  if (!validation.ok) {
    res.status(400).json({
      success: false,
      error: validation.error,
      timestamp: new Date(),
    });
    return;
  }

  saveSettingsToDisk(next);

  applyRuntimeSettings(partial);

  // Apply side-effects where needed
  try {
    nodeManager.reconfigureHealthChecks();
  } catch {
    // best effort
  }
  try {
    applyLoggingFromEnv();
  } catch {
    // best effort
  }

  res.json({
    success: true,
    data: getCurrentRuntimeSettings(),
    timestamp: new Date(),
  });
});

export default router;
