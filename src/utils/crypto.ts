/**
 * ============================================================
 * NODE ORCHESTRATOR - Crypto Utilities
 * ============================================================
 * Fonctions de chiffrement AES-256-GCM pour la sécurité des seeds et clés
 * Utilise Node.js crypto natif au lieu de CryptoJS pour une meilleure sécurité
 */

import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits pour GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Dériver une clé de 32 bytes depuis la clé de configuration
 */
function deriveKey(salt: Buffer): Buffer {
  const masterKey = config.security.encryptionKey;
  return crypto.scryptSync(masterKey, salt, KEY_LENGTH);
}

/**
 * Chiffrer une chaîne avec AES-256-GCM
 * Format de sortie: base64(salt | iv | authTag | ciphertext)
 */
export function encrypt(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Concaténer: salt | iv | authTag | ciphertext
  const result = Buffer.concat([salt, iv, authTag, encrypted]);
  return result.toString('base64');
}

/**
 * Déchiffrer une chaîne
 */
export function decrypt(encryptedText: string): string {
  const data = Buffer.from(encryptedText, 'base64');
  
  // Extraire les composants
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  
  const key = deriveKey(salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  
  return decrypted.toString('utf8');
}

/**
 * Générer un hash SHA256
 */
export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Générer un ID unique sécurisé
 */
export function generateSecureId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Vérifier si une chaîne est chiffrée (format AES-GCM valide)
 */
export function isEncrypted(text: string): boolean {
  try {
    const data = Buffer.from(text, 'base64');
    // Vérifier la longueur minimale: salt + iv + authTag + au moins 1 byte
    if (data.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      return false;
    }
    const decrypted = decrypt(text);
    return decrypted.length > 0;
  } catch {
    return false;
  }
}

/**
 * Chiffrer un objet JSON
 */
export function encryptObject<T extends object>(obj: T): string {
  const jsonString = JSON.stringify(obj);
  return encrypt(jsonString);
}

/**
 * Déchiffrer vers un objet JSON
 */
export function decryptObject<T>(encryptedText: string): T {
  const jsonString = decrypt(encryptedText);
  return JSON.parse(jsonString) as T;
}
