import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * API-level authentication (none | token | basic) applied to all /api routes.
 * - OPTIONS requests are always passed through (for CORS preflight).
 */
export function apiAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const rawMode = config.api.authMode || 'none';
  const mode = rawMode.toLowerCase();

  if (mode === 'none') {
    return next();
  }

  if (mode === 'token') {
    if (!config.api.apiToken) {
      logger.error('API auth misconfigured: API_AUTH_MODE=token but API_TOKEN is empty');
      if (config.isDev) {
        logger.warn('Dev mode: bypassing API auth due to misconfiguration (set API_TOKEN or switch API_AUTH_MODE=none)');
        return next();
      }
      res.status(503).json({ error: 'Server authentication is misconfigured' });
      return;
    }
    const header = req.headers['authorization'] || '';
    const token = typeof header === 'string' && header.startsWith('Bearer ')
      ? header.slice(7)
      : '';

    if (!token || token !== config.api.apiToken) {
      logger.warn('API token missing/invalid', { path: req.path, ip: req.ip });
      res.status(401).json({ error: 'Invalid or missing API token' });
      return;
    }
    next();
    return;
  }

  if (mode === 'basic') {
    if (!config.api.basicUser || !config.api.basicPass) {
      logger.error('API auth misconfigured: API_AUTH_MODE=basic but API_BASIC_USER/API_BASIC_PASS are empty');
      if (config.isDev) {
        logger.warn('Dev mode: bypassing API auth due to misconfiguration (set API_BASIC_USER/API_BASIC_PASS or switch API_AUTH_MODE=none)');
        return next();
      }
      res.status(503).json({ error: 'Server authentication is misconfigured' });
      return;
    }
    const header = req.headers['authorization'] || '';
    if (typeof header !== 'string' || !header.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Orchestrator API"');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');

    if (user !== config.api.basicUser || pass !== config.api.basicPass) {
      logger.warn('API basic auth failed', { path: req.path, ip: req.ip, user });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    next();
    return;
  }

  // Unknown mode: fail closed (allow only in dev for convenience)
  logger.error('Unknown API_AUTH_MODE, refusing request', { mode: rawMode, path: req.path, ip: req.ip });
  if (config.isDev) {
    logger.warn('Dev mode: allowing request despite unknown API_AUTH_MODE', { mode: rawMode });
    next();
    return;
  }
  res.status(503).json({ error: 'Server authentication is misconfigured' });
}

export default apiAuthMiddleware;
