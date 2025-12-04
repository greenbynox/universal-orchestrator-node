/**
 * Tests unitaires - Crypto Utilities
 */

import {
  encrypt,
  decrypt,
  sha256,
  generateSecureId,
  isEncrypted,
  encryptObject,
  decryptObject,
} from '../src/utils/crypto';

describe('Crypto Utilities', () => {
  
  describe('encrypt / decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const original = 'Hello, this is a secret message!';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const original = 'Same message';
      const encrypted1 = encrypt(original);
      const encrypted2 = encrypt(original);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty strings', () => {
      const original = '';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should handle unicode characters', () => {
      const original = '🔐 Émojis et accénts! 日本語';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should throw on invalid encrypted data', () => {
      expect(() => decrypt('invalid-base64-data')).toThrow();
      expect(() => decrypt('')).toThrow();
    });

    it('should handle large strings', () => {
      const original = 'x'.repeat(100000);
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });
  });

  describe('sha256', () => {
    it('should produce consistent hash for same input', () => {
      const hash1 = sha256('test');
      const hash2 = sha256('test');
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different input', () => {
      const hash1 = sha256('test1');
      const hash2 = sha256('test2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce 64 character hex string', () => {
      const hash = sha256('anything');
      
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should match known SHA256 value', () => {
      // SHA256 of "test" is known
      const hash = sha256('test');
      expect(hash).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    });
  });

  describe('generateSecureId', () => {
    it('should produce 32 character hex string', () => {
      const id = generateSecureId();
      
      expect(id).toHaveLength(32);
      expect(id).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should produce unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateSecureId());
      }
      
      expect(ids.size).toBe(1000);
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted data', () => {
      const encrypted = encrypt('test');
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(isEncrypted('plain text')).toBe(false);
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for invalid base64', () => {
      expect(isEncrypted('not-valid-base64!!!')).toBe(false);
    });
  });

  describe('encryptObject / decryptObject', () => {
    it('should encrypt and decrypt objects correctly', () => {
      const original = {
        name: 'Test Wallet',
        balance: 100.5,
        addresses: ['addr1', 'addr2'],
        nested: { key: 'value' },
      };
      
      const encrypted = encryptObject(original);
      const decrypted = decryptObject<typeof original>(encrypted);
      
      expect(decrypted).toEqual(original);
    });

    it('should handle arrays', () => {
      const original = [1, 2, 3, 'four', { five: 5 }];
      
      const encrypted = encryptObject(original as any);
      const decrypted = decryptObject<typeof original>(encrypted);
      
      expect(decrypted).toEqual(original);
    });
  });
});
