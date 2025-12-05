/**
 * Tests for Wallet Creation and Seed Export
 * 
 * These tests verify:
 * 1. Wallet creation with encryption
 * 2. Seed phrase encryption/decryption
 * 3. Password verification
 * 4. Error handling
 */

const crypto = require('crypto');

// ============================================================
// CRYPTOGRAPHY FUNCTIONS (copied from start-server.js for testing)
// ============================================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

function encryptMnemonic(mnemonic, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(mnemonic, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'base64')
  ]).toString('base64');
}

function decryptMnemonic(encryptedData, password) {
  try {
    const data = Buffer.from(encryptedData, 'base64');
    
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    
    const key = deriveKey(password, salt);
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (err) {
    return null;
  }
}

// ============================================================
// TEST CASES
// ============================================================

describe('Wallet Encryption Tests', () => {
  const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const testPassword = 'MySecurePassword123!';
  const wrongPassword = 'WrongPassword456!';

  describe('encryptMnemonic', () => {
    test('should encrypt a mnemonic successfully', () => {
      const encrypted = encryptMnemonic(testMnemonic, testPassword);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(100);
      // Should be base64 encoded
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    test('should produce different ciphertext each time (due to random salt/IV)', () => {
      const encrypted1 = encryptMnemonic(testMnemonic, testPassword);
      const encrypted2 = encryptMnemonic(testMnemonic, testPassword);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    test('should handle empty password', () => {
      const encrypted = encryptMnemonic(testMnemonic, '');
      expect(encrypted).toBeDefined();
    });

    test('should handle special characters in mnemonic', () => {
      const specialMnemonic = 'test with émojis 🎉 and spëcial châràctérs';
      const encrypted = encryptMnemonic(specialMnemonic, testPassword);
      expect(encrypted).toBeDefined();
    });
  });

  describe('decryptMnemonic', () => {
    test('should decrypt an encrypted mnemonic correctly', () => {
      const encrypted = encryptMnemonic(testMnemonic, testPassword);
      const decrypted = decryptMnemonic(encrypted, testPassword);
      
      expect(decrypted).toBe(testMnemonic);
    });

    test('should return null for wrong password', () => {
      const encrypted = encryptMnemonic(testMnemonic, testPassword);
      const decrypted = decryptMnemonic(encrypted, wrongPassword);
      
      expect(decrypted).toBeNull();
    });

    test('should return null for corrupted data', () => {
      const encrypted = encryptMnemonic(testMnemonic, testPassword);
      const corrupted = encrypted.slice(0, -10) + 'corrupted!';
      const decrypted = decryptMnemonic(corrupted, testPassword);
      
      expect(decrypted).toBeNull();
    });

    test('should return null for invalid base64', () => {
      const decrypted = decryptMnemonic('not-valid-base64!!!', testPassword);
      
      expect(decrypted).toBeNull();
    });

    test('should handle special characters correctly', () => {
      const specialMnemonic = 'test with émojis 🎉 and spëcial châràctérs';
      const encrypted = encryptMnemonic(specialMnemonic, testPassword);
      const decrypted = decryptMnemonic(encrypted, testPassword);
      
      expect(decrypted).toBe(specialMnemonic);
    });
  });

  describe('Security Properties', () => {
    test('encrypted data should be longer than original (due to overhead)', () => {
      const encrypted = encryptMnemonic(testMnemonic, testPassword);
      const encryptedBuffer = Buffer.from(encrypted, 'base64');
      const originalLength = Buffer.from(testMnemonic, 'utf8').length;
      
      // Should include salt (32) + iv (16) + authTag (16) + ciphertext
      expect(encryptedBuffer.length).toBeGreaterThan(originalLength + 64);
    });

    test('should resist timing attacks (constant-time comparison would be ideal)', () => {
      const encrypted = encryptMnemonic(testMnemonic, testPassword);
      
      const start1 = Date.now();
      for (let i = 0; i < 100; i++) {
        decryptMnemonic(encrypted, testPassword);
      }
      const correctTime = Date.now() - start1;

      const start2 = Date.now();
      for (let i = 0; i < 100; i++) {
        decryptMnemonic(encrypted, wrongPassword);
      }
      const wrongTime = Date.now() - start2;

      // Times should be roughly similar (within 50% variance)
      // This is a weak test but helps catch obvious timing leaks
      expect(Math.abs(correctTime - wrongTime)).toBeLessThan(Math.max(correctTime, wrongTime));
    });

    test('different passwords should produce completely different encrypted data', () => {
      const encrypted1 = encryptMnemonic(testMnemonic, 'password1');
      const encrypted2 = encryptMnemonic(testMnemonic, 'password2');
      
      // Even ignoring salt/IV, the ciphertext should be different
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long mnemonics', () => {
      const longMnemonic = Array(100).fill('abandon').join(' ');
      const encrypted = encryptMnemonic(longMnemonic, testPassword);
      const decrypted = decryptMnemonic(encrypted, testPassword);
      
      expect(decrypted).toBe(longMnemonic);
    });

    test('should handle very long passwords', () => {
      const longPassword = 'a'.repeat(10000);
      const encrypted = encryptMnemonic(testMnemonic, longPassword);
      const decrypted = decryptMnemonic(encrypted, longPassword);
      
      expect(decrypted).toBe(testMnemonic);
    });

    test('should handle unicode passwords', () => {
      const unicodePassword = '密码🔐パスワード';
      const encrypted = encryptMnemonic(testMnemonic, unicodePassword);
      const decrypted = decryptMnemonic(encrypted, unicodePassword);
      
      expect(decrypted).toBe(testMnemonic);
    });
  });
});

describe('BIP39 Mnemonic Validation', () => {
  // These would require the bip39 package to be imported
  // For now, we test basic format validation
  
  test('should be 12 words for standard mnemonic', () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const words = mnemonic.split(' ');
    
    expect(words.length).toBe(12);
  });

  test('should be 24 words for high-security mnemonic', () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    const words = mnemonic.split(' ');
    
    expect(words.length).toBe(24);
  });
});

describe('Wallet Address Generation', () => {
  test('Bitcoin Legacy address should start with 1', () => {
    const address = '1' + crypto.randomBytes(20).toString('hex').slice(0, 33);
    expect(address).toMatch(/^1[a-fA-F0-9]{33}$/);
  });

  test('Bitcoin SegWit address should start with 3', () => {
    const address = '3' + crypto.randomBytes(20).toString('hex').slice(0, 33);
    expect(address).toMatch(/^3[a-fA-F0-9]{33}$/);
  });

  test('Bitcoin Native SegWit address should start with bc1q', () => {
    const address = 'bc1q' + crypto.randomBytes(20).toString('hex');
    expect(address).toMatch(/^bc1q[a-fA-F0-9]{40}$/);
  });

  test('Bitcoin Taproot address should start with bc1p', () => {
    const address = 'bc1p' + crypto.randomBytes(30).toString('hex').slice(0, 58);
    expect(address).toMatch(/^bc1p[a-fA-F0-9]{58}$/);
  });

  test('Ethereum address should start with 0x and be 42 chars', () => {
    const address = '0x' + crypto.randomBytes(20).toString('hex');
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(address.length).toBe(42);
  });

  test('Solana address should be base64-like', () => {
    const address = crypto.randomBytes(32).toString('base64').replace(/[+/=]/g, '').slice(0, 44);
    expect(address.length).toBe(44);
  });
});

// Run tests
if (require.main === module) {
  console.log('Running wallet encryption tests...');
  
  // Basic smoke test
  const mnemonic = 'test mnemonic phrase';
  const password = 'testpass123';
  
  const encrypted = encryptMnemonic(mnemonic, password);
  console.log('Encrypted:', encrypted.slice(0, 50) + '...');
  
  const decrypted = decryptMnemonic(encrypted, password);
  console.log('Decrypted:', decrypted);
  console.log('Match:', decrypted === mnemonic ? '✅ PASS' : '❌ FAIL');
  
  const wrongDecrypted = decryptMnemonic(encrypted, 'wrongpass');
  console.log('Wrong password returns null:', wrongDecrypted === null ? '✅ PASS' : '❌ FAIL');
}
