import crypto from 'crypto';
import { decryptWithKey, deriveKeyFromPassword, encryptWithKey, walletKeyVerifier } from '../src/utils/crypto';

describe('Wallet password crypto (v2)', () => {
  test('deriveKeyFromPassword is deterministic for same salt/params', () => {
    const salt = crypto.randomBytes(16);
    const params = { N: 16384, r: 8, p: 1, dkLen: 32 };
    const k1 = deriveKeyFromPassword('CorrectHorseBatteryStaple1', salt, params);
    const k2 = deriveKeyFromPassword('CorrectHorseBatteryStaple1', salt, params);
    expect(k1.equals(k2)).toBe(true);
  });

  test('encryptWithKey/decryptWithKey roundtrip', () => {
    const salt = crypto.randomBytes(16);
    const key = deriveKeyFromPassword('CorrectHorseBatteryStaple1', salt, { N: 16384, r: 8, p: 1, dkLen: 32 });
    const msg = 'seed words go here';
    const enc = encryptWithKey(msg, key);
    const dec = decryptWithKey(enc, key);
    expect(dec).toBe(msg);
  });

  test('decryptWithKey fails with wrong key', () => {
    const salt = crypto.randomBytes(16);
    const key1 = deriveKeyFromPassword('CorrectHorseBatteryStaple1', salt, { N: 16384, r: 8, p: 1, dkLen: 32 });
    const key2 = deriveKeyFromPassword('WrongPassword2', salt, { N: 16384, r: 8, p: 1, dkLen: 32 });
    const enc = encryptWithKey('top secret', key1);
    expect(() => decryptWithKey(enc, key2)).toThrow();
  });

  test('walletKeyVerifier differs for different keys', () => {
    const salt = crypto.randomBytes(16);
    const k1 = deriveKeyFromPassword('CorrectHorseBatteryStaple1', salt, { N: 16384, r: 8, p: 1, dkLen: 32 });
    const k2 = deriveKeyFromPassword('AnotherPassword3', salt, { N: 16384, r: 8, p: 1, dkLen: 32 });
    expect(walletKeyVerifier(k1).equals(walletKeyVerifier(k2))).toBe(false);
  });
});
