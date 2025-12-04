/**
 * Tests unitaires - Validation Utilities
 */

import {
  sanitizeInput,
  validateNodeId,
  validateWalletId,
  validateBlockchain,
  validateNodeMode,
  validateSeedPhrase,
  validatePassword,
  escapeForLog,
  parsePositiveInt,
} from '../src/utils/validation';

describe('Validation Utilities', () => {
  
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should remove control characters', () => {
      expect(sanitizeInput('hello\x00world')).toBe('helloworld');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    it('should limit length', () => {
      const longString = 'a'.repeat(300);
      expect(sanitizeInput(longString, 100).length).toBe(100);
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
      expect(sanitizeInput(123 as any)).toBe('');
    });
  });

  describe('validateNodeId', () => {
    it('should accept valid node IDs', () => {
      expect(validateNodeId('bitcoin-a1b2c3d4')).toBe(true);
      expect(validateNodeId('ethereum-deadbeef')).toBe(true);
      expect(validateNodeId('monero-12345678')).toBe(true);
    });

    it('should reject invalid node IDs', () => {
      expect(validateNodeId('')).toBe(false);
      expect(validateNodeId('invalid')).toBe(false);
      expect(validateNodeId('bitcoin-tooshort')).toBe(false);
      expect(validateNodeId('unknown-a1b2c3d4')).toBe(false);
      expect(validateNodeId(null as any)).toBe(false);
    });
  });

  describe('validateWalletId', () => {
    it('should accept valid wallet IDs', () => {
      expect(validateWalletId('wallet-bitcoin-a1b2c3d4')).toBe(true);
      expect(validateWalletId('wallet-ethereum-deadbeef')).toBe(true);
    });

    it('should reject invalid wallet IDs', () => {
      expect(validateWalletId('')).toBe(false);
      expect(validateWalletId('wallet-invalid-abc')).toBe(false);
      expect(validateWalletId('bitcoin-a1b2c3d4')).toBe(false);
    });
  });

  describe('validateBlockchain', () => {
    it('should accept valid blockchains', () => {
      expect(validateBlockchain('bitcoin')).toBe(true);
      expect(validateBlockchain('ethereum')).toBe(true);
      expect(validateBlockchain('solana')).toBe(true);
      expect(validateBlockchain('monero')).toBe(true);
      expect(validateBlockchain('bnb')).toBe(true);
    });

    it('should reject invalid blockchains', () => {
      expect(validateBlockchain('litecoin')).toBe(false);
      expect(validateBlockchain('')).toBe(false);
      expect(validateBlockchain('BITCOIN')).toBe(false);
    });
  });

  describe('validateNodeMode', () => {
    it('should accept valid modes', () => {
      expect(validateNodeMode('full')).toBe(true);
      expect(validateNodeMode('pruned')).toBe(true);
      expect(validateNodeMode('light')).toBe(true);
    });

    it('should reject invalid modes', () => {
      expect(validateNodeMode('archive')).toBe(false);
      expect(validateNodeMode('')).toBe(false);
    });
  });

  describe('validateSeedPhrase', () => {
    it('should accept valid seed phrases', () => {
      const seed12 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(validateSeedPhrase(seed12)).toBe(true);
      
      const seed24 = 'abandon '.repeat(23) + 'art';
      expect(validateSeedPhrase(seed24)).toBe(true);
    });

    it('should reject invalid seed phrases', () => {
      expect(validateSeedPhrase('')).toBe(false);
      expect(validateSeedPhrase('too short')).toBe(false);
      expect(validateSeedPhrase(null as any)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('Password1').valid).toBe(true);
      expect(validatePassword('mySecure123Pass').valid).toBe(true);
    });

    it('should reject passwords without letters', () => {
      const result = validatePassword('12345678');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('lettre');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('abcdefgh');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('chiffre');
    });

    it('should reject short passwords', () => {
      const result = validatePassword('Abc1');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('8 caractères');
    });

    it('should reject too long passwords', () => {
      const result = validatePassword('a'.repeat(129) + '1');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('128');
    });
  });

  describe('escapeForLog', () => {
    it('should escape special characters', () => {
      expect(escapeForLog('line1\nline2')).toBe('line1\\nline2');
      expect(escapeForLog('tab\there')).toBe('tab\\there');
      expect(escapeForLog('quote"here')).toBe('quote\\"here');
    });

    it('should handle non-string input', () => {
      expect(escapeForLog(null as any)).toBe('');
    });
  });

  describe('parsePositiveInt', () => {
    it('should parse valid integers', () => {
      expect(parsePositiveInt(42)).toBe(42);
      expect(parsePositiveInt('100')).toBe(100);
      expect(parsePositiveInt(0)).toBe(0);
    });

    it('should return default for invalid input', () => {
      expect(parsePositiveInt('abc', 10)).toBe(10);
      expect(parsePositiveInt(-5, 0)).toBe(0);
      expect(parsePositiveInt(null, 50)).toBe(50);
    });
  });
});
