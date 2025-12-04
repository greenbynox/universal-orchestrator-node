/**
 * ============================================================
 * NODE ORCHESTRATOR - Authentication Middleware
 * ============================================================
 * Middleware JWT pour sécuriser les routes sensibles
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from './logger';

// Extension de Request pour inclure l'utilisateur authentifié
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'admin' | 'user';
        iat?: number;
        exp?: number;
      };
    }
  }
}

// Simple token store pour invalidation (en production, utiliser Redis)
const invalidatedTokens = new Set<string>();

/**
 * Générer un token d'authentification simple
 * En production, utiliser jsonwebtoken avec RS256
 */
export function generateToken(userId: string, role: 'admin' | 'user' = 'user'): string {
  const payload = {
    id: userId,
    role,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24h
  };
  
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.security.jwtSecret)
    .update(payloadB64)
    .digest('base64url');
  
  return `${payloadB64}.${signature}`;
}

/**
 * Vérifier et décoder un token
 */
export function verifyToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const [payloadB64, signature] = token.split('.');
    
    if (!payloadB64 || !signature) {
      return { valid: false, error: 'Format de token invalide' };
    }
    
    // Vérifier la signature
    const expectedSignature = crypto
      .createHmac('sha256', config.security.jwtSecret)
      .update(payloadB64)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Signature invalide' };
    }
    
    // Décoder le payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    
    // Vérifier l'expiration
    if (payload.exp && payload.exp < Date.now()) {
      return { valid: false, error: 'Token expiré' };
    }
    
    // Vérifier si le token a été invalidé
    if (invalidatedTokens.has(token)) {
      return { valid: false, error: 'Token révoqué' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Token malformé' };
  }
}

/**
 * Invalider un token (logout)
 */
export function invalidateToken(token: string): void {
  invalidatedTokens.add(token);
  // En production, stocker dans Redis avec TTL
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
  
  const result = verifyToken(token);
  
  if (!result.valid) {
    logger.warn('Tentative d\'accès non autorisé', { 
      ip: req.ip, 
      path: req.path,
      error: result.error,
    });
    
    res.status(401).json({
      success: false,
      error: result.error || 'Token invalide',
      timestamp: new Date(),
    });
    return;
  }
  
  req.user = result.payload;
  next();
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
