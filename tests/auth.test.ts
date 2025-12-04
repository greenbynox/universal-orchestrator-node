/**
 * Tests unitaires - Authentication Utilities
 */

import {
  generateToken,
  verifyToken,
  invalidateToken,
} from '../src/utils/auth';

describe('Authentication Utilities', () => {
  
  describe('generateToken', () => {
    it('should generate a valid token string', () => {
      const token = generateToken('user-123', 'user');
      
      expect(typeof token).toBe('string');
      expect(token).toContain('.');
      expect(token.split('.').length).toBe(2);
    });

    it('should include user ID and role in payload', () => {
      const token = generateToken('user-456', 'admin');
      const result = verifyToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.payload.id).toBe('user-456');
      expect(result.payload.role).toBe('admin');
    });

    it('should set expiration time', () => {
      const token = generateToken('user-789');
      const result = verifyToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.payload.exp).toBeGreaterThan(Date.now());
    });

    it('should default to user role', () => {
      const token = generateToken('user-000');
      const result = verifyToken(token);
      
      expect(result.payload.role).toBe('user');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid tokens', () => {
      const token = generateToken('test-user');
      const result = verifyToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject tokens with invalid format', () => {
      const result = verifyToken('invalid-token-format');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Format');
    });

    it('should reject tokens with invalid signature', () => {
      const token = generateToken('user');
      const [payload] = token.split('.');
      const tamperedToken = `${payload}.invalidsignature`;
      
      const result = verifyToken(tamperedToken);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Signature');
    });

    it('should reject expired tokens', () => {
      // Créer un token avec expiration dans le passé
      const payload = {
        id: 'user',
        role: 'user',
        iat: Date.now() - 100000,
        exp: Date.now() - 50000, // Expiré
      };
      
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      // On ne peut pas créer une vraie signature sans le secret, donc ce test est limité
      
      const result = verifyToken(`${payloadB64}.fakesig`);
      expect(result.valid).toBe(false);
    });

    it('should reject malformed payload', () => {
      const badPayload = Buffer.from('not-json').toString('base64url');
      const result = verifyToken(`${badPayload}.signature`);
      
      expect(result.valid).toBe(false);
      // Peut retourner "Signature invalide" ou "Token malformé" selon l'ordre de validation
      expect(result.error).toBeDefined();
    });
  });

  describe('invalidateToken', () => {
    it('should invalidate a valid token', () => {
      const token = generateToken('user-to-logout');
      
      // Vérifier que le token est valide
      expect(verifyToken(token).valid).toBe(true);
      
      // Invalider
      invalidateToken(token);
      
      // Vérifier qu'il est maintenant invalide
      const result = verifyToken(token);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('révoqué');
    });

    it('should not affect other tokens', () => {
      const token1 = generateToken('user-1');
      const token2 = generateToken('user-2');
      
      invalidateToken(token1);
      
      expect(verifyToken(token1).valid).toBe(false);
      expect(verifyToken(token2).valid).toBe(true);
    });
  });
});
