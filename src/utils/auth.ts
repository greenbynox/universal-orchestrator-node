/**
 * ============================================================
 * NODE ORCHESTRATOR - Authentication Middleware
 * ============================================================
 * Middleware JWT pour sécuriser les routes sensibles
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from './logger';

// Extension de Request pour inclure l'utilisateur authentifié
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'admin' | 'user';
      };
    }
  }
}

/**
 * Middleware d'authentification JWT
 * Vérifie le token Bearer dans le header Authorization
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // En mode développement, bypass optionnel (à désactiver en production)
  if (config.isDev && req.headers['x-bypass-auth'] === 'true') {
    req.user = { id: 'dev-user', role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Token d\'authentification requis',
      timestamp: new Date(),
    });
    return;
  }

  const token = authHeader.substring(7);
  
  try {
    // TODO: Implémenter la vérification JWT complète
    // Pour le MVP, on vérifie juste que le token existe et correspond au secret
    // En production, utiliser jsonwebtoken ou jose pour décoder et vérifier
    
    if (!token || token.length < 10) {
      throw new Error('Token invalide');
    }

    // Placeholder - En production, décoder le JWT et extraire les claims
    req.user = {
      id: 'authenticated-user',
      role: 'user',
    };
    
    next();
  } catch (error) {
    logger.warn('Tentative d\'accès non autorisé', { 
      ip: req.ip, 
      path: req.path,
      error: (error as Error).message 
    });
    
    res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré',
      timestamp: new Date(),
    });
  }
}

/**
 * Middleware pour vérifier le rôle admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Accès administrateur requis',
      timestamp: new Date(),
    });
    return;
  }
  next();
}

/**
 * Middleware optionnel - authentifie si token présent, sinon continue
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return requireAuth(req, res, next);
  }
  
  next();
}
